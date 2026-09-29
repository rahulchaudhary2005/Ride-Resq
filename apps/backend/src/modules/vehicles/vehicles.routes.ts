import { Router } from "express";
import { vehiclesController } from "./vehicles.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createVehicleSchema } from "./vehicles.validation";

const router = Router();
router.use(authMiddleware);

router.post("/", validate(createVehicleSchema), vehiclesController.create);
router.get("/mine", vehiclesController.listMine);
router.delete("/:id", vehiclesController.remove);

export default router;
