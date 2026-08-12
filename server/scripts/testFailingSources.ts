import { adapterRegistry } from '../services/adapters/AdapterRegistry';

async function testUrl(name: string, url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, text/html, */*'
      }
    });
    const status = res.status;
    const text = await res.text();
    const result = adapterRegistry.parseWithBestAdapter(text, 'RSS', url);
    if (result.items.length > 0) {
      console.log(`SUCCESS: ${name} (${url}) -> Status: ${status}, Articles: ${result.items.length}, Adapter: ${result.adapterUsed}`);
      console.log(`   Sample: ${result.items[0].title}`);
    } else {
      console.log(`NO ITEMS: ${name} (${url}) -> Status: ${status}, Adapter: ${result.adapterUsed}, Len: ${text.length}, Preview: ${text.substring(0, 100).replace(/\n/g, ' ')}`);
    }
  } catch (err: any) {
    console.log(`ERROR: ${name} (${url}) -> ${err.message}`);
  }
}

async function run() {
  console.log('--- TESTING BAHRAIN CANDIDATES ---');
  await testUrl('Bahrain News Net', 'http://www.bahrainnews.net/rss.php');
  await testUrl('Bahrain News Net Cat', 'http://www.bahrainnews.net/rss.php?cat=f825227702a0a2df');
  await testUrl('BNA 1', 'https://www.bna.bh/ar/rss');
  await testUrl('BNA 2', 'https://bna.bh/ar/rss');
  await testUrl('BNA 3', 'https://www.bna.bh/rss');

  console.log('\n--- TESTING JORDAN / AL RAI CANDIDATES ---');
  await testUrl('Al Rai 1', 'https://alrai.com/rss');
  await testUrl('Al Rai 2', 'https://www.alrai.com/rss');
  await testUrl('Al Rai Media', 'https://www.alraimedia.com/rss');
  await testUrl('Ammon News Jordan', 'https://www.ammonnews.net/articleRss.aspx');
  await testUrl('Al Ghad Jordan', 'https://alghad.com/feed/');
  await testUrl('Jo24 Jordan', 'https://jo24.net/rss.php');
}

run().catch(console.error);
