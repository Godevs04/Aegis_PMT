import { Request, Response, NextFunction } from 'express';
import { searchService } from './search.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

export class SearchController {
  /**
   * GET /api/search?q=&workspaceId=&limit=&types=
   *
   * Global search across tasks, projects, members, comments, labels.
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { q, workspaceId, limit = '20', types } = req.query;

      if (!q) throw new AppError('Query parameter "q" is required.', 400);
      if (!workspaceId) throw new AppError('workspaceId is required.', 400);

      const typesList = types ? (types as string).split(',') : undefined;

      const results = await searchService.search(
        q as string,
        workspaceId as string,
        req.user.id,
        {
          limit: Math.min(parseInt(limit as string, 10) || 20, 50),
          types: typesList,
        }
      );

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Search results retrieved successfully.',
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default SearchController;
