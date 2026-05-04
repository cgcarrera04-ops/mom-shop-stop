// Netlify Edge Function: Dynamic OG meta tags for product sharing
// Intercepts requests to / and injects product OG tags when ?p=PRODUCT_ID is present

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR1J2ZGvPhJHN1_69hFD8qNT3WbEJP1X1BGTlZdnYzF8Xw8zcfGdTMNidLmt5tMQOT1_t_4chZ-jiKD/pub?output=csv';
const SITE_URL = 'https://momshopstop.netlify.app';
const DEFAULT_IMG = 'https://i.postimg.cc/jqQxBx8p/image.png';

export default async (request, context) => {
    const url = new URL(request.url);
    const productId = url.searchParams.get('p');

    // No product param → serve page normally
    if (!productId) return context.next();

    // Fetch and parse CSV
    let product = null;
    try {
        const resp = await fetch(CSV_URL);
        if (resp.ok) {
            const csv = await resp.text();
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
            const idIdx = headers.indexOf('id');
            const nameIdx = headers.indexOf('name');
            const descIdx = headers.indexOf('shortDesc');
            const imgIdx = headers.indexOf('image');
            const priceIdx = headers.indexOf('price');

            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
                if (cols[idIdx] === productId) {
                    product = {
                        id: cols[idIdx],
                        name: cols[nameIdx] || 'Producto Mom Shop Stop',
                        desc: cols[descIdx] || 'Suplementos y vitaminas importados de USA con envío a todo el Perú.',
                        image: cols[imgIdx] || DEFAULT_IMG,
                        price: cols[priceIdx] || ''
                    };
                    break;
                }
            }
        }
    } catch (e) {
        // If CSV fetch fails, just serve page normally
        return context.next();
    }

    if (!product) return context.next();

    // Get the original page HTML
    const response = await context.next();
    let html = await response.text();

    const title = `${product.name} | Mom Shop Stop`;
    const description = `${product.desc}${product.price ? ` · S/ ${parseFloat(product.price).toFixed(2)}` : ''} — Envíos a todo el Perú 🇵🇪`;
    const shareUrl = `${SITE_URL}/?p=${product.id}`;

    // Inject OG tags right after <head>
    const ogTags = `
    <!-- Dynamic OG tags injected by edge function -->
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="Mom Shop Stop">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${product.image}">
    <meta property="og:image:width" content="800">
    <meta property="og:image:height" content="800">
    <meta property="og:url" content="${shareUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${product.image}">
    <title>${title}</title>`;

    // Replace <title> and inject OG before </head>
    html = html.replace(/<title>[^<]*<\/title>/, '');
    html = html.replace('</head>', `${ogTags}\n</head>`);

    return new Response(html, {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
        status: response.status
    });
};
