"""Local-only course viewer, with byte-range support for lecture audio and PDFs."""
import argparse
import functools
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class CourseHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        self.byte_range = None
        path = Path(self.translate_path(self.path))
        header = self.headers.get('Range', '')
        if not path.is_file() or not header:
            return super().send_head()
        size = path.stat().st_size
        match = re.fullmatch(r'bytes=(\d*)-(\d*)', header.strip())
        if not match or not size:
            self.send_error(416, 'Unsupported range')
            return None
        left, right = match.groups()
        start = int(left) if left else max(0, size - int(right or size))
        end = min(int(right), size - 1) if left and right else size - 1
        if start > end or start >= size:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{size}')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return None
        stream = path.open('rb')
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(str(path)))
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(end - start + 1))
        self.send_header('Accept-Ranges', 'bytes')
        self.end_headers()
        self.byte_range = (start, end)
        return stream

    def copyfile(self, source, outputfile):
        if self.byte_range is None:
            return super().copyfile(source, outputfile)
        start, end = self.byte_range
        source.seek(start)
        remaining = end - start + 1
        try:
            while remaining:
                block = source.read(min(256 * 1024, remaining))
                if not block:
                    break
                outputfile.write(block)
                remaining -= len(block)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=9602)
    args = parser.parse_args()
    handler = functools.partial(CourseHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    print(f'http://127.0.0.1:{args.port}/07_Assignment_2_Lab/', flush=True)
    server.serve_forever()
