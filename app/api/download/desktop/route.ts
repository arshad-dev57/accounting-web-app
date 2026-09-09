import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/download/desktop?platform=mac|win
 *
 * Streams the desktop POS installer from the local file system.
 * File paths are configured via server-only env vars:
 *   DESKTOP_APP_MAC_PATH  — absolute path to the .dmg / .zip
 *   DESKTOP_APP_WIN_PATH  — absolute path to the .exe / .msi
 *
 * Used only in local/self-hosted environments.
 * In production, set NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC/WIN to a direct CDN URL instead.
 */
export async function GET(req: NextRequest) {
  try {
    const platform = req.nextUrl.searchParams.get('platform') ?? 'mac';

    const macPath = (process.env.DESKTOP_APP_MAC_PATH ?? '').trim();
    const winPath = (process.env.DESKTOP_APP_WIN_PATH ?? '').trim();

    const filePath = platform === 'win' ? winPath : macPath;

    if (!filePath) {
      return NextResponse.json(
        {
          error:
            'Download not configured. Set DESKTOP_APP_MAC_PATH or DESKTOP_APP_WIN_PATH in .env.local.',
        },
        { status: 404 }
      );
    }

    const resolved = path.resolve(filePath);

    if (!fs.existsSync(resolved)) {
      return NextResponse.json(
        { error: `Installer file not found: ${resolved}` },
        { status: 404 }
      );
    }

    const stat = fs.statSync(resolved);
    const filename = path.basename(resolved);
    const ext = path.extname(filename).toLowerCase();

    console.log(
      '[desktop-download]',
      JSON.stringify({
        platform,
        resolvedFile: filename,
        sizeBytes: stat.size,
        ext,
      })
    );

  const mimeMap: Record<string, string> = {
    '.dmg': 'application/x-apple-diskimage',
    '.exe': 'application/x-msdownload',
    '.msi': 'application/x-msi',
    '.zip': 'application/zip',
    '.pkg': 'application/x-newton-compatible-pkg',
  };
  const mime = mimeMap[ext] ?? 'application/octet-stream';

  // Stream the file so memory usage stays flat regardless of size
  const stream = fs.createReadStream(resolved);
  const webStream = new ReadableStream({
    start(controller) {
      stream.on('data', (chunk) => controller.enqueue(chunk));
      stream.on('end', () => controller.close());
      stream.on('error', (err) => controller.error(err));
    },
    cancel() {
      stream.destroy();
    },
  });

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(stat.size),
      'Cache-Control': 'no-store',
    },
  });
  } catch (err: any) {
    console.error('[desktop-download] failed:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate download' },
      { status: 500 }
    );
  }
}
