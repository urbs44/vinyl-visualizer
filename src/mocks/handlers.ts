import { http, HttpResponse } from 'msw';
import { TRACK_FIXTURE } from './fixtures';

export const handlers = [
  http.get('https://api.spotify.com/v1/me/player/currently-playing', () =>
    HttpResponse.json(TRACK_FIXTURE)
  ),
];
