import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth.js";
import * as service from "../services/foodService.js";

type FoodBody = {
  name: string;
  category: string;
  protein: number;
  carbs: number;
  fat: number;
};

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await service.listFoods(req.user!, {
      category: req.query.category,
      search: req.query.search,
      includeInactive: req.query.includeInactive,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await service.getFood(req.params.id as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await service.createFood(req.body as FoodBody);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await service.updateFood(req.params.id as string, req.body as FoodBody);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await service.softDeleteFood(req.params.id as string);
    res.json({ success: true, message: "Alimento eliminado" });
  } catch (err) {
    next(err);
  }
}

export async function restore(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await service.restoreFood(req.params.id as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
