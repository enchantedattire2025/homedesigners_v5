import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDownload = vi.fn();

vi.mock('../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        download: mockDownload,
      })),
    },
  },
}));

import { downloadFileFromStorage } from '../../utils/downloadFile';
import { supabase as mockSupabase } from '../../lib/supabase';

beforeEach(() => {
  vi.clearAllMocks();
  mockDownload.mockReset();
  vi.stubGlobal('alert', vi.fn());
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  });
  vi.stubGlobal('Blob', class MockBlob {
    constructor(public parts: unknown[], public options: any) {}
  });
  const mockLink = {
    href: '',
    download: '',
    click: vi.fn(),
  } as any;
  vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
  vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
  vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
});

describe('downloadFileFromStorage', () => {
  it('alerts on failure when URL is invalid (not a storage URL)', async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);

    await downloadFileFromStorage('https://example.com/invalid-url', 'test');

    expect(mockSupabase.storage.from).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();
  });

  it('alerts on failure for a completely invalid URL string', async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);

    await downloadFileFromStorage('not-a-url', 'test');

    expect(alertSpy).toHaveBeenCalled();
  });

  it('calls supabase storage download with correct bucket and path', async () => {
    const mockBlob = { type: 'image/png' };
    mockDownload.mockResolvedValueOnce({ data: mockBlob, error: null });

    const url = 'https://example.com/storage/v1/object/public/designer-images/profile/photo.png';
    await downloadFileFromStorage(url, 'photo.png');

    expect(mockSupabase.storage.from).toHaveBeenCalledWith('designer-images');
    expect(mockDownload).toHaveBeenCalledWith('profile/photo.png');
  });

  it('alerts on download error from supabase', async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    mockDownload.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

    const url = 'https://example.com/storage/v1/object/public/bucket/file.png';
    await downloadFileFromStorage(url, 'file.png');

    expect(alertSpy).toHaveBeenCalled();
  });

  it('alerts when no data received', async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    mockDownload.mockResolvedValueOnce({ data: null, error: null });

    const url = 'https://example.com/storage/v1/object/public/bucket/file.png';
    await downloadFileFromStorage(url, 'file.png');

    expect(alertSpy).toHaveBeenCalled();
  });
});
