const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const BASE_URL = 'https://docs.google.com/spreadsheets/d/10nPfebrAzLCb6SfDWkPk7G4hBNIycPRZI-4AhA8AOis/gviz/tq?tqx=out:csv&sheet=';

async function build() {
    console.log("Starting SSG build for Mom Shop Stop...");

    try {
        console.log("Fetching data from Google Sheets...");
        
        const [productsRes, blogsRes] = await Promise.all([
            fetch(BASE_URL + 'Productos'),
            fetch(BASE_URL + 'Blog')
        ]);

        if (!productsRes.ok || !blogsRes.ok) {
            throw new Error("Failed to fetch data from sheets.");
        }

        const productsCsv = await productsRes.text();
        const blogsCsv = await blogsRes.text();

        // Parse CSVs
        const productsData = Papa.parse(productsCsv, { header: true, skipEmptyLines: true }).data;
        const blogsData = Papa.parse(blogsCsv, { header: true, skipEmptyLines: true }).data;

        // Ensure directories
        const blogDir = path.join(__dirname, 'blog');
        if (!fs.existsSync(blogDir)) {
            fs.mkdirSync(blogDir);
        }

        const templatePath = path.join(__dirname, 'blog-template.html');
        if (!fs.existsSync(templatePath)) {
            throw new Error("blog-template.html not found.");
        }
        const templateStr = fs.readFileSync(templatePath, 'utf8');

        blogsData.forEach(blog => {
            if (!blog.title) return;

            // Generate slug dynamically from title if not present
            const slug = blog.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            if (!slug) return;

            let html = templateStr;
            html = html.replace(/{{TITLE}}/g, blog.title);
            html = html.replace(/{{META_DESCRIPTION}}/g, blog.meta_description || '');
            html = html.replace(/{{CONTENT}}/g, blog.content_html || '');

            // Cross-selling logic
            let productCardHtml = '';
            if (blog.featured_product_id) {
                const product = productsData.find(p => String(p.id) === String(blog.featured_product_id));
                if (product) {
                    productCardHtml = `
                    <div class="mt-12 p-6 bg-pink-50 rounded-2xl border-2 border-custom-dark-pink text-center shadow-lg">
                        <h3 class="text-xl font-bold text-slate-800 mb-4">Recomendado para ti</h3>
                        <div class="flex flex-col sm:flex-row items-center gap-6 justify-center">
                            <img src="${product.image}" alt="${product.name}" class="w-32 h-32 object-cover rounded-xl shadow-md">
                            <div class="text-left">
                                <h4 class="font-bold text-lg text-custom-dark-pink">${product.name}</h4>
                                <p class="text-sm text-slate-600 mb-4">${product.shortDesc}</p>
                                <a href="/?p=${product.id}" class="inline-block bg-custom-dark-pink text-white font-bold py-2 px-6 rounded-xl hover:bg-pink-600 transition transform hover:-translate-y-1 shadow-md">Comprar Ahora - S/ ${product.price}</a>
                            </div>
                        </div>
                    </div>
                    `;
                }
            }
            html = html.replace(/{{FEATURED_PRODUCT}}/g, productCardHtml);

            const outPath = path.join(blogDir, `${slug}.html`);
            fs.writeFileSync(outPath, html, 'utf8');
            console.log(`Generated blog post: /blog/${slug}.html`);
        });

        console.log("SSG build finished successfully.");

    } catch (err) {
        console.error("Build failed:", err);
        process.exit(1);
    }
}

build();
