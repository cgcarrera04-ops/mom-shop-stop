const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR1J2ZGvPhJHN1_69hFD8qNT3WbEJP1X1BGTlZdnYzF8Xw8zcfGdTMNidLmt5tMQOT1_t_4chZ-jiKD/pub?output=csv';

exports.handler = async function(event, context) {
    try {
        const response = await fetch(CSV_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; MomShopStop/1.0)',
                'Accept': 'text/csv,text/plain,*/*'
            },
            redirect: 'follow'
        });

        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `Google Sheets returned ${response.status}` })
            };
        }

        const csvText = await response.text();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=120'
            },
            body: csvText
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: error.message })
        };
    }
};
