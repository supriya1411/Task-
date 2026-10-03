import { Request, Response, NextFunction } from 'express';
import { WeatherService } from '../services/weatherService.ts';

export class WeatherController {
  // GET /api/weather
  static async getWeather(req: Request, res: Response, next: NextFunction) {
    try {
      const city = (req.query.city as string) || process.env.WEATHER_DEFAULT_CITY || 'New York';
      const weather = await WeatherService.getWeatherByCity(city);

      res.setHeader('X-Cache-Status', weather.cached ? 'HIT' : 'MISS');

      return res.status(200).json({
        success: true,
        data: weather,
      });
    } catch (err) {
      next(err);
    }
  }
}
