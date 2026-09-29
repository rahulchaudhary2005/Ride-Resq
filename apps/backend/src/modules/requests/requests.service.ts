import { prisma } from "../../config/db";
import { ApiError } from "../../utils/errors";
import { getIO } from "../../config/socket";
import {
  calculateFare,
  FareCalculation,
} from "../../services/maps.service";
import { notifyUser } from "../../services/notification.service";
import {
  RequestStatus,
  ServiceCategory,
  FareMode,
  FareOfferStatus,
} from "@prisma/client";

interface QuoteInput {
  category: ServiceCategory;

  pickupLat: number;
  pickupLng: number;

  dropLat?: number;
  dropLng?: number;
}

interface CreateRequestInput
  extends QuoteInput {
  customerId: string;

  vehicleId?: string;

  description?: string;

  pickupAddress: string;

  dropAddress?: string;

  customerRequestedFare?: number;
}

type ActorRole =
  | "CUSTOMER"
  | "MECHANIC"
  | "ADMIN";

const SEARCH_RADIUS_KM = 10;

const LOCATION_STALE_MS =
  2 * 60 * 1000;

/**
 * Haversine distance.
 *
 * Used only for mechanic-dispatch proximity.
 * Fare calculation uses Google Routes API.
 */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (value: number) =>
    (value * Math.PI) / 180;

  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;

  const clampedA = Math.min(
    1,
    Math.max(0, a),
  );

  return (
    earthRadiusKm *
    2 *
    Math.atan2(
      Math.sqrt(clampedA),
      Math.sqrt(1 - clampedA),
    )
  );
}

/**
 * Store the exact pricing configuration used
 * when the request was created.
 *
 * This prevents future admin pricing changes
 * from changing an existing request.
 */
function buildFareSnapshot(
  calculation: FareCalculation,
) {
  return {
    distanceKm:
      calculation.distanceKm,

    pricingBaseFareSnapshot:
      calculation.baseFare,

    pricingPerKmRateSnapshot:
      calculation.perKmRate,

    pricingMinFareSnapshot:
      calculation.minFare,

    pricingSurgeSnapshot:
      calculation.surgeMultiplier,

    pricingVersionSnapshot:
      calculation.pricingVersion,
  };
}

/**
 * Validate coordinate pairs.
 */
function validateDropCoordinates(
  input: {
    dropLat?: number;
    dropLng?: number;
  },
): void {
  const hasDropLat =
    input.dropLat !== undefined;

  const hasDropLng =
    input.dropLng !== undefined;

  if (hasDropLat !== hasDropLng) {
    throw ApiError.badRequest(
      "dropLat and dropLng must be provided together",
    );
  }
}

/**
 * Validate customer supplied fare.
 *
 * The frontend is never trusted.
 * The backend compares the offer against
 * the authoritative minimum fare.
 */
function validateCustomerOffer(
  offer: number,
  minFare: number,
): void {
  if (!Number.isFinite(offer)) {
    throw ApiError.badRequest(
      "Customer requested fare must be a valid number",
    );
  }

  if (offer < 0) {
    throw ApiError.badRequest(
      "Customer requested fare cannot be negative",
    );
  }

  if (offer < minFare) {
    throw ApiError.badRequest(
      `Requested fare cannot be below the minimum fare of ₹${minFare}`,
    );
  }
}

export const requestsService = {
  /**
   * Calculate a fare quote.
   *
   * This does NOT create a request.
   */
  async quote(input: QuoteInput) {
    validateDropCoordinates(input);

    const calculation =
      await calculateFare(
        input.category,

        {
          lat: input.pickupLat,
          lng: input.pickupLng,
        },

        input.dropLat !== undefined &&
          input.dropLng !== undefined
          ? {
            lat: input.dropLat,
            lng: input.dropLng,
          }
          : undefined,
      );

    return {
      category: input.category,
      ...calculation,
    };
  },

  /**
   * Create a new roadside assistance request.
   *
   * Automatic mode:
   *
   *   estimatedFare = agreedFare
   *
   * Customer offer mode:
   *
   *   estimatedFare = system calculation
   *   customerRequestedFare = customer's offer
   *   agreedFare = null
   *   fareOfferStatus = PENDING
   */
  async create(
    input: CreateRequestInput,
  ) {
    validateDropCoordinates(input);

    /**
     * Validate selected vehicle ownership.
     */
    if (input.vehicleId) {
      const vehicle =
        await prisma.vehicle.findFirst({
          where: {
            id: input.vehicleId,
            ownerId: input.customerId,
          },

          select: {
            id: true,
          },
        });

      if (!vehicle) {
        throw ApiError.badRequest(
          "Selected vehicle does not belong to this customer",
        );
      }
    }

    /**
     * Calculate authoritative fare.
     */
    const calculation =
      await calculateFare(
        input.category,

        {
          lat: input.pickupLat,
          lng: input.pickupLng,
        },

        input.dropLat !== undefined &&
          input.dropLng !== undefined
          ? {
            lat: input.dropLat,
            lng: input.dropLng,
          }
          : undefined,
      );

    /**
     * Default pricing mode.
     */
    let fareMode: FareMode =
      FareMode.AUTOMATIC;

    let fareOfferStatus: FareOfferStatus =
      FareOfferStatus.NONE;

    /**
     * Automatic fare is immediately agreed.
     */
    let agreedFare:
      | number
      | null =
      calculation.estimatedFare;

    /**
     * Customer negotiated fare.
     */
    if (
      input.customerRequestedFare !==
      undefined
    ) {
      if (
        input.customerRequestedFare <
        calculation.minFare
      ) {
        throw ApiError.badRequest(
          `Customer requested fare cannot be below the minimum fare of ₹${calculation.minFare.toFixed(2)}`,
        );
      }
      // validateCustomerOffer(
      //   input.customerRequestedFare,
      //   calculation.minFare,
      // );

      fareMode =
        FareMode.CUSTOMER_OFFER;

      fareOfferStatus =
        FareOfferStatus.PENDING;

      /**
       * IMPORTANT:
       *
       * Do NOT redeclare agreedFare here.
       *
       * Customer's offer must be accepted
       * by a mechanic before becoming agreedFare.
       */
      agreedFare = null;
    }

    /**
     * Create request.
     */
    const request =
      await prisma.serviceRequest.create({
        data: {
          customerId:
            input.customerId,

          category:
            input.category,

          vehicleId:
            input.vehicleId,

          description:
            input.description,

          pickupLat:
            input.pickupLat,

          pickupLng:
            input.pickupLng,

          pickupAddress:
            input.pickupAddress,

          dropLat:
            input.dropLat,

          dropLng:
            input.dropLng,

          dropAddress:
            input.dropAddress,

          /**
           * Authoritative system estimate.
           */
          estimatedFare:
            calculation.estimatedFare,

          /**
           * Automatic:
           *   estimated fare
           *
           * Customer offer:
           *   null until mechanic accepts.
           */
          agreedFare,

          fareMode,

          customerRequestedFare:
            input.customerRequestedFare ??
            null,

          fareOfferStatus,

          /**
           * Immutable pricing snapshot.
           */
          ...buildFareSnapshot(
            calculation,
          ),

          status:
            RequestStatus.PENDING,
        },
      });

    /**
     * Dispatch to nearby mechanics.
     */
    await this.dispatchToNearbyMechanics(
      request.id,
    );

    return request;
  },
  async createOffer(
    requestId: string,
    customerId: string,
    amount: number,
  ) {
    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw ApiError.badRequest(
        "Offer amount must be a valid positive number",
      );
    }

    const request =
      await prisma.serviceRequest.findUnique({
        where: {
          id: requestId,
        },
      });

    if (!request) {
      throw ApiError.notFound(
        "Service request not found",
      );
    }

    /**
     * Only the request owner can
     * submit a customer offer.
     */
    if (
      request.customerId !==
      customerId
    ) {
      throw ApiError.forbidden(
        "You do not own this request",
      );
    }

    /**
     * Offers are only allowed before
     * a mechanic accepts the request.
     */
    if (
      request.fareOfferStatus !==
      FareOfferStatus.PENDING &&
      request.fareOfferStatus !==
      FareOfferStatus.REJECTED
    ) {
      throw ApiError.conflict(
        "Fare offers can only be changed while the request is pending",
      );
    }

    /**
     * This request must be using
     * customer negotiation mode.
     */
    if (
      request.fareMode !==
      FareMode.CUSTOMER_OFFER
    ) {
      throw ApiError.conflict(
        "This request is using automatic pricing",
      );
    }

    /**
     * Minimum fare comes from the
     * immutable pricing snapshot.
     */
    const minimumFare =
      request.pricingMinFareSnapshot !==
        null
        ? Number(
          request.pricingMinFareSnapshot,
        )
        : Number(
          request.estimatedFare,
        );

    if (
      !Number.isFinite(minimumFare)
    ) {
      throw ApiError.internal(
        "Request pricing snapshot is invalid",
      );
    }

    if (amount < minimumFare) {
      throw ApiError.badRequest(
        `Offer cannot be below the minimum fare of ₹${minimumFare.toFixed(
          2,
        )}`,
      );
    }

    const updated =
      await prisma.serviceRequest.update({
        where: {
          id: requestId,
        },

        data: {
          customerRequestedFare:
            amount,

          fareMode:
            FareMode.CUSTOMER_OFFER,

          fareOfferStatus:
            FareOfferStatus.PENDING,

          /**
           * Changing an offer means there
           * is not yet an agreed fare.
           */
          agreedFare: null,
        },
      });

    const io = getIO();

    /**
     * Notify the currently available
     * nearby/assigned mechanic if one
     * exists.
     */
    if (updated.mechanicId) {
      const mechanic =
        await prisma.mechanicProfile.findUnique({
          where: {
            id: updated.mechanicId,
          },
        });

      if (mechanic) {
        io.to(
          `user:${mechanic.userId}`,
        ).emit(
          "request:offer_updated",
          updated,
        );

        await notifyUser(
          mechanic.userId,
          {
            type: "REQUEST_UPDATE",

            title:
              "Customer updated fare offer",

            body:
              `New customer offer: ₹${amount.toFixed(
                2,
              )}`,

            data: {
              requestId:
                updated.id,
            },
          },
        );
      }
    }

    /**
     * Notify customer session(s).
     */
    io.to(
      `user:${updated.customerId}`,
    ).emit(
      "request:offer_updated",
      updated,
    );

    return updated;
  },
  async acceptOffer(
    requestId: string,
    mechanicUserId: string,
  ) {
    const mechanic =
      await prisma.mechanicProfile.findUnique({
        where: {
          userId: mechanicUserId,
        },
      });

    if (!mechanic) {
      throw ApiError.forbidden(
        "Mechanic profile not found",
      );
    }

    if (
      !mechanic.isOnline ||
      mechanic.verificationStatus !==
      "APPROVED"
    ) {
      throw ApiError.forbidden(
        "Only an approved online mechanic can accept an offer",
      );
    }

    const request =
      await prisma.serviceRequest.findUnique({
        where: {
          id: requestId,
        },
      });

    if (!request) {
      throw ApiError.notFound(
        "Service request not found",
      );
    }

    if (
      request.status !==
      RequestStatus.PENDING
    ) {
      throw ApiError.conflict(
        "This request is no longer pending",
      );
    }

    if (
      request.fareMode !==
      FareMode.CUSTOMER_OFFER
    ) {
      throw ApiError.conflict(
        "This request does not contain a customer fare offer",
      );
    }

    if (
      request.fareOfferStatus !==
      FareOfferStatus.PENDING
    ) {
      throw ApiError.conflict(
        "This fare offer is no longer pending",
      );
    }

    if (
      request.customerRequestedFare ===
      null
    ) {
      throw ApiError.conflict(
        "Customer fare offer is missing",
      );
    }

    if (
      !mechanic.serviceCategories.includes(
        request.category,
      )
    ) {
      throw ApiError.forbidden(
        "You do not service this category",
      );
    }

    /**
     * Atomic request claim.
     *
     * This protects against two mechanics
     * accepting the same request.
     */
    const result =
      await prisma.$transaction(
        async (tx) => {
          const updated =
            await tx.serviceRequest.updateMany(
              {
                where: {
                  id: requestId,

                  status:
                    RequestStatus.PENDING,

                  fareMode:
                    FareMode.CUSTOMER_OFFER,

                  fareOfferStatus:
                    FareOfferStatus.PENDING,

                  mechanicId: null,
                },

                data: {
                  status:
                    RequestStatus.ACCEPTED,

                  mechanicId:
                    mechanic.id,

                  acceptedAt:
                    new Date(),

                  agreedFare:
                    request.customerRequestedFare,

                  fareOfferStatus:
                    FareOfferStatus.ACCEPTED,
                },
              },
            );

          return updated.count;
        },
      );

    if (result !== 1) {
      throw ApiError.conflict(
        "This request or fare offer was already accepted",
      );
    }

    const updated =
      await prisma.serviceRequest.findUniqueOrThrow(
        {
          where: {
            id: requestId,
          },
        },
      );

    const io = getIO();

    /**
     * Customer receives immediate
     * acceptance notification.
     */
    io.to(
      `user:${updated.customerId}`,
    ).emit(
      "request:offer_accepted",
      updated,
    );

    io.to(
      `request:${requestId}`,
    ).emit(
      "request:offer_accepted",
      updated,
    );

    await notifyUser(
      updated.customerId,
      {
        type: "REQUEST_UPDATE",

        title:
          "Fare offer accepted",

        body:
          `Mechanic accepted your offer of ₹${Number(
            updated.agreedFare,
          ).toFixed(2)}`,

        data: {
          requestId,
        },
      },
    );

    return updated;
  },
  async rejectOffer(
    requestId: string,
    mechanicUserId: string,
  ) {
    const mechanic =
      await prisma.mechanicProfile.findUnique({
        where: {
          userId: mechanicUserId,
        },
      });

    if (!mechanic) {
      throw ApiError.forbidden(
        "Mechanic profile not found",
      );
    }

    if (
      !mechanic.isOnline ||
      mechanic.verificationStatus !==
      "APPROVED"
    ) {
      throw ApiError.forbidden(
        "Only an approved online mechanic can reject an offer",
      );
    }

    const request =
      await prisma.serviceRequest.findUnique({
        where: {
          id: requestId,
        },
      });

    if (!request) {
      throw ApiError.notFound(
        "Service request not found",
      );
    }

    if (
      request.status !==
      RequestStatus.PENDING
    ) {
      throw ApiError.conflict(
        "This request is no longer pending",
      );
    }

    if (
      request.fareMode !==
      FareMode.CUSTOMER_OFFER
    ) {
      throw ApiError.conflict(
        "This request does not contain a customer fare offer",
      );
    }

    if (
      request.fareOfferStatus !==
      FareOfferStatus.PENDING
    ) {
      throw ApiError.conflict(
        "This fare offer is no longer pending",
      );
    }

    /**
     * At this stage the request is not yet
     * assigned to a mechanic.
     *
     * Any eligible mechanic can reject it.
     *
     * We therefore don't set mechanicId.
     */
    if (
      !mechanic.serviceCategories.includes(
        request.category,
      )
    ) {
      throw ApiError.forbidden(
        "You do not service this category",
      );
    }

    const updated =
      await prisma.serviceRequest.update({
        where: {
          id: requestId,
        },

        data: {
          fareOfferStatus:
            FareOfferStatus.REJECTED,
        },
      });

    const io = getIO();

    /**
     * Notify customer.
     */
    io.to(
      `user:${updated.customerId}`,
    ).emit(
      "request:offer_rejected",
      updated,
    );

    await notifyUser(
      updated.customerId,
      {
        type: "REQUEST_UPDATE",

        title:
          "Fare offer declined",

        body:
          "A mechanic declined your fare offer. You can submit another offer.",

        data: {
          requestId,
        },
      },
    );

    return updated;
  },

  /**
   * Dispatch request to nearby approved,
   * online mechanics.
   */
  async dispatchToNearbyMechanics(
    requestId: string,
  ) {
    const request =
      await prisma.serviceRequest.findUniqueOrThrow(
        {
          where: {
            id: requestId,
          },
        },
      );

    /**
     * Only mechanics who:
     *
     * - are online
     * - are approved
     * - support the category
     * - have a location
     */
    const candidates =
      await prisma.mechanicProfile.findMany({
        where: {
          isOnline: true,

          verificationStatus:
            "APPROVED",

          serviceCategories: {
            has: request.category,
          },

          currentLat: {
            not: null,
          },

          currentLng: {
            not: null,
          },
        },

        include: {
          user: true,
        },
      });

    const now = Date.now();

    const nearby = candidates
      .filter((mechanic) => {
        if (
          mechanic.currentLat ===
          null ||
          mechanic.currentLng === null
        ) {
          return false;
        }

        /**
         * Don't treat stale mechanic
         * location as live availability.
         */
        if (
          !mechanic.lastLocationUpdate ||
          now -
          mechanic.lastLocationUpdate.getTime() >
          LOCATION_STALE_MS
        ) {
          return false;
        }

        const distance =
          haversineKm(
            request.pickupLat,
            request.pickupLng,
            mechanic.currentLat,
            mechanic.currentLng,
          );

        return (
          distance <= SEARCH_RADIUS_KM
        );
      })
      .sort((a, b) => {
        const distanceA =
          haversineKm(
            request.pickupLat,
            request.pickupLng,
            a.currentLat!,
            a.currentLng!,
          );

        const distanceB =
          haversineKm(
            request.pickupLat,
            request.pickupLng,
            b.currentLat!,
            b.currentLng!,
          );

        return distanceA - distanceB;
      });

    /**
     * No mechanic available.
     */
    if (nearby.length === 0) {
      await prisma.serviceRequest.update({
        where: {
          id: requestId,
        },

        data: {
          status:
            RequestStatus.NO_MECHANIC_FOUND,
        },
      });

      return;
    }

    const io = getIO();

    /**
     * Send request to every suitable
     * nearby mechanic.
     */
    for (const mechanic of nearby) {
      io.to(
        `user:${mechanic.userId}`,
      ).emit(
        "request:new",
        request,
      );

      await notifyUser(
        mechanic.userId,
        {
          type: "REQUEST_UPDATE",

          title:
            "New service request nearby",

          body: `${request.category.replace(
            "_",
            " ",
          )} request at ${request.pickupAddress}`,

          data: {
            requestId:
              request.id,
          },
        },
      );
    }
  },

  /**
   * Update request state.
   *
   * Customer:
   *   - can only cancel own request
   *
   * Mechanic:
   *   - can accept pending request
   *   - can update assigned request
   *
   * Admin:
   *   - controlled state management
   */
  async updateStatus(
    requestId: string,
    actorId: string,
    actorRole: ActorRole,
    status: RequestStatus,
    extra?: {
      cancelReason?: string;
    },
  ) {
    const request =
      await prisma.serviceRequest.findUnique(
        {
          where: {
            id: requestId,
          },
        },
      );

    if (!request) {
      throw ApiError.notFound(
        "Service request not found",
      );
    }

    /*
     * CUSTOMER permissions
     */
    if (
      actorRole === "CUSTOMER"
    ) {
      if (
        request.customerId !==
        actorId
      ) {
        throw ApiError.forbidden(
          "You do not own this request",
        );
      }

      if (
        status !==
        RequestStatus.CANCELLED
      ) {
        throw ApiError.forbidden(
          "Customers can only cancel their own request",
        );
      }

      const terminalStatuses: RequestStatus[] = [
        RequestStatus.COMPLETED,
        RequestStatus.CANCELLED,
        RequestStatus.NO_MECHANIC_FOUND,
      ];

      if (terminalStatuses.includes(request.status)) {
        throw ApiError.conflict(
          "This request can no longer be cancelled",
        );
      }
    }

    /*
     * MECHANIC permissions
     */
    if (
      actorRole === "MECHANIC"
    ) {
      const mechanic =
        await prisma.mechanicProfile.findUnique(
          {
            where: {
              userId: actorId,
            },
          },
        );

      if (!mechanic) {
        throw ApiError.forbidden(
          "Mechanic profile not found",
        );
      }

      /*
       * Mechanic accepting a request.
       */
      if (
        status ===
        RequestStatus.ACCEPTED
      ) {
        if (
          request.status !==
          RequestStatus.PENDING
        ) {
          throw ApiError.conflict(
            "Request is no longer available",
          );
        }

        if (
          !mechanic.isOnline ||
          mechanic.verificationStatus !==
          "APPROVED"
        ) {
          throw ApiError.forbidden(
            "Only an approved online mechanic can accept requests",
          );
        }

        if (
          !mechanic.serviceCategories.includes(
            request.category,
          )
        ) {
          throw ApiError.forbidden(
            "You do not service this category",
          );
        }

        /**
         * If this is a customer offer,
         * the offer MUST exist.
         */
        if (
          request.fareMode ===
          FareMode.CUSTOMER_OFFER &&
          request.customerRequestedFare ===
          null
        ) {
          throw ApiError.conflict(
            "Customer fare offer is missing",
          );
        }

        /**
         * Atomic claim.
         *
         * Multiple mechanics may receive
         * the same socket event.
         *
         * Only one mechanic can claim
         * PENDING -> ACCEPTED.
         */
        const claimed =
          await prisma.$transaction(
            async (tx) => {
              const result =
                await tx.serviceRequest.updateMany(
                  {
                    where: {
                      id: requestId,

                      status:
                        RequestStatus.PENDING,
                    },

                    data: {
                      status:
                        RequestStatus.ACCEPTED,

                      mechanicId:
                        mechanic.id,

                      acceptedAt:
                        new Date(),

                      /**
                       * Customer offer becomes
                       * the agreed fare when
                       * mechanic accepts.
                       */
                      agreedFare:
                        request.fareMode ===
                          FareMode.CUSTOMER_OFFER
                          ? request.customerRequestedFare
                          : request.agreedFare,

                      fareOfferStatus:
                        request.fareMode ===
                          FareMode.CUSTOMER_OFFER
                          ? FareOfferStatus.ACCEPTED
                          : FareOfferStatus.NONE,
                    },
                  },
                );

              return result.count === 1;
            },
          );

        if (!claimed) {
          throw ApiError.conflict(
            "Request already accepted by another mechanic",
          );
        }
      } else {
        /**
         * Mechanic must be assigned.
         */
        if (
          request.mechanicId !==
          mechanic.id
        ) {
          throw ApiError.forbidden(
            "You are not assigned to this request",
          );
        }

        const allowedTransitions:
          Record<
            string,
            RequestStatus[]
          > = {
          ACCEPTED: [
            RequestStatus.ARRIVED,
            RequestStatus.CANCELLED,
          ],

          ARRIVED: [
            RequestStatus.IN_PROGRESS,
            RequestStatus.CANCELLED,
          ],

          IN_PROGRESS: [
            RequestStatus.COMPLETED,
            RequestStatus.CANCELLED,
          ],
        };

        const allowed =
          allowedTransitions[
          request.status
          ] ?? [];

        if (
          !allowed.includes(status)
        ) {
          throw ApiError.conflict(
            `Invalid status transition from ${request.status} to ${status}`,
          );
        }
      }
    }

    /*
     * ADMIN permissions.
     */
    if (
      actorRole === "ADMIN"
    ) {
      /**
       * Admin cannot complete a request
       * without an assigned mechanic.
       */
      if (
        status ===
        RequestStatus.COMPLETED
      ) {
        if (!request.mechanicId) {
          throw ApiError.conflict(
            "Cannot complete a request without an assigned mechanic",
          );
        }
      }
    }

    /**
     * Timestamp fields.
     */
    const timestampField: {
      arrivedAt?: Date;
      completedAt?: Date;
      cancelledAt?: Date;
    } = {};

    if (
      status ===
      RequestStatus.ARRIVED
    ) {
      timestampField.arrivedAt =
        new Date();
    }

    if (
      status ===
      RequestStatus.COMPLETED
    ) {
      timestampField.completedAt =
        new Date();
    }

    if (
      status ===
      RequestStatus.CANCELLED
    ) {
      timestampField.cancelledAt =
        new Date();
    }

    let updated;

    /**
     * ACCEPTED was already atomically
     * persisted above.
     */
    if (
      status ===
      RequestStatus.ACCEPTED &&
      actorRole === "MECHANIC"
    ) {
      updated =
        await prisma.serviceRequest.findUniqueOrThrow(
          {
            where: {
              id: requestId,
            },
          },
        );
    } else {
      /**
       * For COMPLETED, use the agreed fare.
       *
       * Customer offer:
       *   agreedFare = customer offer
       *
       * Automatic:
       *   agreedFare = estimated fare
       */
      updated =
        await prisma.serviceRequest.update(
          {
            where: {
              id: requestId,
            },

            data: {
              status,

              cancelReason:
                status ===
                  RequestStatus.CANCELLED
                  ? extra?.cancelReason
                  : undefined,

              finalFare:
                status ===
                  RequestStatus.COMPLETED
                  ? request.agreedFare ??
                  request.estimatedFare
                  : undefined,

              ...timestampField,
            },
          },
        );
    }

    /**
     * Increment mechanic completed jobs.
     *
     * IMPORTANT:
     * This should only happen once when
     * the request transitions to COMPLETED.
     */
    if (
      status ===
      RequestStatus.COMPLETED &&
      updated.mechanicId
    ) {
      await prisma.mechanicProfile.update({
        where: {
          id: updated.mechanicId,
        },

        data: {
          totalJobsCompleted: {
            increment: 1,
          },
        },
      });
    }

    /**
     * Socket updates.
     */
    const io = getIO();

    io.to(
      `request:${requestId}`,
    ).emit(
      "request:status",
      updated,
    );

    io.to(
      `user:${request.customerId}`,
    ).emit(
      "request:status",
      updated,
    );

    /**
     * Push notification.
     */
    await notifyUser(
      request.customerId,
      {
        type: "REQUEST_UPDATE",

        title:
          "Request update",

        body: `Your request is now ${status
          .replace("_", " ")
          .toLowerCase()}`,

        data: {
          requestId,
        },
      },
    );

    return updated;
  },

  /**
   * Get one request with authorization.
   */
  async getById(
    id: string,
    actorId: string,
    actorRole: ActorRole,
  ) {
    const request =
      await prisma.serviceRequest.findUnique(
        {
          where: {
            id,
          },

          include: {
            mechanic: {
              include: {
                user: true,
              },
            },

            customer: true,

            vehicle: true,

            payment: true,
          },
        },
      );

    if (!request) {
      throw ApiError.notFound(
        "Service request not found",
      );
    }

    /**
     * Customer ownership.
     */
    if (
      actorRole === "CUSTOMER" &&
      request.customerId !==
      actorId
    ) {
      throw ApiError.forbidden(
        "You do not have access to this request",
      );
    }

    /**
     * Mechanic assignment.
     */
    if (
      actorRole === "MECHANIC"
    ) {
      const mechanic =
        await prisma.mechanicProfile.findUnique(
          {
            where: {
              userId: actorId,
            },
          },
        );

      if (
        !mechanic ||
        request.mechanicId !==
        mechanic.id
      ) {
        throw ApiError.forbidden(
          "You do not have access to this request",
        );
      }
    }

    return request;
  },

  /**
   * List requests for customer or mechanic.
   */
  async listForUser(
    userId: string,
    role:
      | "CUSTOMER"
      | "MECHANIC",
  ) {
    if (
      role === "CUSTOMER"
    ) {
      return prisma.serviceRequest.findMany(
        {
          where: {
            customerId: userId,
          },

          orderBy: {
            createdAt: "desc",
          },
        },
      );
    }

    const mechanic =
      await prisma.mechanicProfile.findUnique(
        {
          where: {
            userId,
          },
        },
      );

    if (!mechanic) {
      return [];
    }

    return prisma.serviceRequest.findMany({
      where: {
        mechanicId: mechanic.id,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  },
};