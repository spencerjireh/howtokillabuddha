import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCollection } from 'astro:content';

const mockRss = vi.fn(() => new Response('<rss></rss>'));

vi.mock('@astrojs/rss', () => ({
  default: mockRss,
}));

async function callGET() {
  const mod = await import('@/pages/rss.xml');
  return mod.GET({
    site: new URL('https://blog.spencerjireh.com'),
  } as any);
}

describe('rss.xml GET', () => {
  const fakePosts = [
    {
      id: 'older-post',
      data: {
        title: 'Older Post',
        description: 'An older post.',
        date: new Date('2025-01-01'),
        draft: false,
      },
    },
    {
      id: 'newer-post',
      data: {
        title: 'Newer Post',
        description: 'A newer post.',
        date: new Date('2025-03-15'),
        draft: false,
      },
    },
    {
      id: 'draft-post',
      data: {
        title: 'Draft Post',
        description: 'A draft.',
        date: new Date('2025-02-01'),
        draft: true,
      },
    },
  ];

  function mockGetCollection() {
    vi.mocked(getCollection).mockImplementation((_: any, filter: any) =>
      Promise.resolve(filter ? fakePosts.filter(filter) : fakePosts) as any
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes correct title and description to rss()', async () => {
    mockGetCollection();
    await callGET();

    expect(mockRss).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "jireh's blog",
        description: 'Code, shaders, and whatever else.',
      })
    );
  });

  it('filters out draft posts via getCollection callback', async () => {
    vi.mocked(getCollection).mockImplementation((_: any, filter: any) => {
      return Promise.resolve(fakePosts.filter(filter)) as any;
    });
    await callGET();

    const args = mockRss.mock.calls[0][0] as any;
    const titles = args.items.map((i: any) => i.title);
    expect(titles).not.toContain('Draft Post');
  });

  it('sorts posts newest-first', async () => {
    mockGetCollection();
    await callGET();

    const args = mockRss.mock.calls[0][0] as any;
    const titles = args.items.map((i: any) => i.title);
    expect(titles).toEqual(['Newer Post', 'Older Post']);
  });

  it('maps items to correct RSS fields', async () => {
    mockGetCollection();
    await callGET();

    const args = mockRss.mock.calls[0][0] as any;
    expect(args.items[0]).toEqual({
      title: 'Newer Post',
      pubDate: new Date('2025-03-15'),
      description: 'A newer post.',
      link: '/blog/newer-post/',
    });
  });

  it('generates correct link format /blog/${id}/', async () => {
    mockGetCollection();
    await callGET();

    const args = mockRss.mock.calls[0][0] as any;
    expect(args.items[0].link).toBe('/blog/newer-post/');
  });
});
