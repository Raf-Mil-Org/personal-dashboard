<script setup>
import axios from 'axios';
import { onMounted, ref } from 'vue';

const stockTickers = ['AAPL', 'GOOGL', 'MSFT']; // Replace with desired tickers
const stockData = ref([]);
const loading = ref(true);
const apiKey = 'Pnl0BywrfmDHSzaVmtjQR1sFTBmSPboY'; // Replace with your FMP API key

const fetchStockData = async () => {
    try {
        const requests = stockTickers.map(async (ticker) => {
            const profileResponse = await axios.get(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${apiKey}`);
            const quoteResponse = await axios.get(`https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${apiKey}`);
            const metricsResponse = await axios.get(`https://financialmodelingprep.com/api/v3/key-metrics/${ticker}?limit=1&apikey=${apiKey}`);

            return {
                symbol: ticker,
                name: profileResponse.data[0]?.companyName || 'N/A',
                price: quoteResponse.data[0]?.price || 'N/A',
                psRatio: metricsResponse.data[0]?.priceToSalesRatioTTM || 'N/A',
                pbRatio: metricsResponse.data[0]?.priceToBookRatio || 'N/A',
                epsGrowth: metricsResponse.data[0]?.epsGrowth || 'N/A',
                revenueGrowth: metricsResponse.data[0]?.revenueGrowth || 'N/A',
                competitors: 'N/A' // This data might not be available in free tier
            };
        });

        stockData.value = await Promise.all(requests);
    } catch (error) {
        console.error('Error fetching stock data:', error);
    } finally {
        loading.value = false;
    }
};

onMounted(fetchStockData);
</script>

<template>
    <h1>RAAAF</h1>
    <div>
        <DataTable :value="stockData" :paginator="true" :rows="10" :loading="loading" responsiveLayout="scroll">
            <Column field="symbol" header="Ticker" sortable></Column>
            <Column field="name" header="Company Name" sortable></Column>
            <Column field="price" header="Price (USD)" sortable></Column>
            <Column field="psRatio" header="P/S Ratio" sortable></Column>
            <Column field="pbRatio" header="P/B Ratio" sortable></Column>
            <Column field="epsGrowth" header="EPS Growth (%)" sortable></Column>
            <Column field="revenueGrowth" header="Revenue Growth (%)" sortable></Column>
            <Column field="competitors" header="Competitors"></Column>
        </DataTable>
    </div>
</template>
