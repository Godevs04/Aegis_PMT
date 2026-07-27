import { Request, Response, NextFunction } from 'express';
import { Label } from './label.model';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

export class LabelController {
  /**
   * GET /api/labels?workspaceId=
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workspaceId } = req.query;
      if (!workspaceId) throw new AppError('workspaceId is required.', 400);

      const labels = await Label.find({ workspaceId })
        .sort({ name: 1 })
        .lean();

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Labels retrieved successfully.',
        data: labels,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/labels
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { name, color, workspaceId } = req.body;
      if (!name || !color || !workspaceId) {
        throw new AppError('name, color, and workspaceId are required.', 400);
      }

      const existing = await Label.findOne({ workspaceId, name: name.trim() });
      if (existing) throw new AppError('A label with this name already exists.', 409);

      const label = await Label.create({
        name: name.trim(),
        color,
        workspaceId,
        createdBy: req.user.id,
      });

      sendResponse({
        res,
        statusCode: 201,
        success: true,
        message: 'Label created successfully.',
        data: label,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/labels/:labelId
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { labelId } = req.params;
      const { name, color } = req.body;

      const label = await Label.findById(labelId);
      if (!label) throw new AppError('Label not found.', 404);

      if (name !== undefined) label.name = name.trim();
      if (color !== undefined) label.color = color;

      await label.save();

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Label updated successfully.',
        data: label,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/labels/:labelId
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { labelId } = req.params;
      const label = await Label.findById(labelId);
      if (!label) throw new AppError('Label not found.', 404);

      await label.softDelete(req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Label deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default LabelController;
