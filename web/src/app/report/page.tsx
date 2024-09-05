"use client";
import React, { useRef, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Navbar from '@/Components/Navbar';
import { MainContent } from '@/Components/Main';

// Import necessary components from chart.js
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Register the components globally
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const chartData = {
    yearly: {
        labels: ['2020', '2021', '2022', '2023', '2024'],
        datasets: [{
            label: 'Credited',
            data: [5000, 6000, 7500, 8000, 8500],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
        }],
    },
    monthly: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        datasets: [{
            label: 'Credited',
            data: [500, 750, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3250],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
        }],
    },
    weekly: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
            label: 'Credited',
            data: [150, 200, 250, 300],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
        }],
    },
    daily: {
        labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        datasets: [{
            label: 'Credited',
            data: [50, 75, 100, 125, 150, 175, 200],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
        }],
    },
};

const ChartComponent = () => {
    const chartRef = useRef(null);
    const [selectedRange, setSelectedRange] = useState<'yearly' | 'monthly' | 'weekly' | 'daily'>('monthly');

    // Update chart data based on selected range
    const updateChartData = (range: 'yearly' | 'monthly' | 'weekly' | 'daily') => {
        const updatedData = chartData[range];
        if (chartRef.current) {
            (chartRef as any).current.data = updatedData;
            (chartRef as any).current.update();
        }
    };

    // Handle dropdown selection for time range
    const handleRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const range = event.target.value as 'yearly' | 'monthly' | 'weekly' | 'daily';
        setSelectedRange(range);
        updateChartData(range);
    };

    // Export chart as image, CSV, or Excel
    const exportChart = (type: 'image' | 'csv' | 'excel') => {
        const chart = chartRef.current;

        switch (type) {
            case 'image':
                if (chart) {
                    const link = document.createElement('a');
                    link.href = (chart as any).toBase64Image();
                    link.download = 'chart.png';
                    link.click();
                }
                break;
            case 'csv':
                let csvContent = 'Month, Sales\n';
                chartData.monthly.labels.forEach((label, index) => {
                    csvContent += `${label},${chartData.monthly.datasets[0].data[index]}\n`;
                });

                const csvLink = document.createElement('a');
                csvLink.href = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
                csvLink.download = 'chart-data.csv';
                csvLink.click();
                break;
            case 'excel':
                const worksheet = XLSX.utils.json_to_sheet(chartData.monthly.labels.map((label, index) => ({
                    Month: label,
                    Sales: chartData.monthly.datasets[0].data[index],
                })));

                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');
                const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                saveAs(blob, 'chart-data.xlsx');
                break;
        }
    };

    // Download selection component
    const DownloadSelection = () => {
        const handleDownload = (event: React.ChangeEvent<HTMLSelectElement>) => {
            exportChart(event.target.value as 'image' | 'csv' | 'excel');
        };

        return (
            <select id="download-select" onChange={handleDownload} style={{ backgroundColor: 'gray', color: 'black' }}>
                <option value="">Download as...</option>
                <option value="image">Image (PNG)</option>
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
            </select>
        );
    };

    return (
        <>
            <Navbar />
            <MainContent />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'white', padding: '20px' }}>
                <div style={{ width: '100%', maxWidth: '1200px', height: 'auto', position: 'relative', padding: '20px', boxSizing: 'border-box' }}>
                    {/* Dropdown Menu */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <select onChange={handleRangeChange} style={{ padding: '10px', backgroundColor: 'gray', color: 'black', border: 'none', borderRadius: '5px' }}>
                            <option value="yearly">Yearly</option>
                            <option value="monthly" selected>Monthly</option>
                            <option value="weekly">Weekly</option>
                            <option value="daily">Daily</option>
                        </select>
                        {/* Uncomment if you want to include the DownloadSelection */}
                        {/* <DownloadSelection /> */}
                    </div>

                    {/* Bar Chart */}
                    <div style={{ width: '100%', height: 'auto', flexGrow: '1', position: 'relative', aspectRatio: '2 / 1' }}>
                        <Bar ref={chartRef} data={chartData.monthly} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>

                    {/* Table */}
                    <div style={{ marginTop: '70px', overflowX: 'auto' }}>
                        <p className='text-black mb-2'><strong>Today Transactions</strong></p>
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', color: 'black', marginTop: '2%' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid black' }}>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>No</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Credited (RM)</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>

                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid black' }}>
                                    <td style={{ padding: '10px' }}>1</td>
                                    <td style={{ padding: '10px' }}>Amirun</td>
                                    <td style={{ padding: '10px' }}>5</td>
                                    <td style={{ padding: '10px' }}>2024/08/23</td>

                                </tr>
                                <tr style={{ borderBottom: '1px solid black' }}>
                                    <td style={{ padding: '10px' }}>1</td>
                                    <td style={{ padding: '10px' }}>Aqmar</td>
                                    <td style={{ padding: '10px' }}>5</td>
                                    <td style={{ padding: '10px' }}>2024/08/23</td>

                                </tr>

                                <tr style={{ borderBottom: '1px solid black' }}>
                                    <td style={{ padding: '10px' }}>1</td>
                                    <td style={{ padding: '10px' }}>Ahmad</td>
                                    <td style={{ padding: '10px' }}>5</td>
                                    <td style={{ padding: '10px' }}>2024/08/23</td>

                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>


        </>
    );
};

export default ChartComponent;
