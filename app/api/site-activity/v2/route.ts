import {
  GET as getSiteActivity,
  POST as recordSiteActivity
} from '../route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = getSiteActivity;
export const POST = recordSiteActivity;
