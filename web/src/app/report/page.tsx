"use client";
import React, { useRef, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import XLSX from 'xlsx';
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
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const ChartComponent = () => {
    // Declare the chartRef inside the functional component
    const chartRef: any = useRef(null);

    // Sample data for different time ranges (yearly, monthly, weekly, daily)
    const chartData = {
        yearly: {
            labels: ['2020', '2021', '2022', '2023', '2024'],
            datasets: [
                {
                    label: 'Credited',
                    data: [5000, 6000, 7500, 8000, 8500],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                },
            ],
        },
        monthly: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            datasets: [
                {
                    label: 'Credited',
                    data: [500, 750, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3250],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                },
            ],
        },
        weekly: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [
                {
                    label: 'Credited',
                    data: [150, 200, 250, 300],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                },
            ],
        },
        daily: {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            datasets: [
                {
                    label: 'Credited',
                    data: [50, 75, 100, 125, 150, 175, 200],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                },
            ],
        },
    };

    // Function to change data based on selection
    const updateChartData = (range: 'yearly' | 'monthly' | 'weekly' | 'daily') => {
        const updatedData = chartData[range];
        chartRef.current.data = updatedData;  // Update chart data
        chartRef.current.update();  // Re-render the chart
    };

    const DynamicRangeSelection = ({ range }: { range: string }) => {
        const [startYear, setStartYear] = useState('2020');
        const [endYear, setEndYear] = useState('2024');
        const [selectedMonth, setSelectedMonth] = useState('');
        const [selectedWeek, setSelectedWeek] = useState('');
        const [selectedDay, setSelectedDay] = useState('');

        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

        if (range === 'yearly') {
            return (
                <div style={{ backgroundColor: 'gray', color: 'black' }}>
                    <label>Start Year: </label>
                    <select value={startYear} onChange={(e) => setStartYear(e.target.value)} style={{ backgroundColor: 'gray', color: 'black' }}>
                        {Array.from({ length: 6 }, (_, i) => 2020 + i).map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                    <label> End Year: </label>
                    <select value={endYear} onChange={(e) => setEndYear(e.target.value)} style={{ backgroundColor: 'gray', color: 'black' }}>
                        {Array.from({ length: 6 }, (_, i) => 2020 + i).map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        if (range === 'monthly') {
            return (
                <div style={{ backgroundColor: 'gray', color: 'black' }}>
                    <label>Select Month: </label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ backgroundColor: 'gray', color: 'black' }}>
                        {months.map((month, index) => (
                            <option key={index} value={month}>
                                {month}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        if (range === 'weekly') {
            return (
                <div style={{ backgroundColor: 'gray', color: 'black' }}>
                    <label>Select Month: </label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ backgroundColor: 'gray', color: 'black' }}>
                        {months.map((month, index) => (
                            <option key={index} value={month}>
                                {month}
                            </option>
                        ))}
                    </select>
                    {selectedMonth && (
                        <>
                            <label> Select Week: </label>
                            <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} style={{ backgroundColor: 'gray', color: 'black' }}>
                                {weeks.map((week, index) => (
                                    <option key={index} value={week}>
                                        {week}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}
                </div>
            );
        }

        if (range === 'daily') {
            return (
                <div style={{ backgroundColor: 'gray', color: 'black' }}>
                    <label>Select Month: </label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ backgroundColor: 'gray', color: 'black' }}>
                        {months.map((month, index) => (
                            <option key={index} value={month}>
                                {month}
                            </option>
                        ))}
                    </select>
                    {selectedMonth && (
                        <>
                            <label> Select Day: </label>
                            <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} style={{ backgroundColor: 'gray', color: 'black' }}>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                    <option key={day} value={day}>
                                        {day}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}
                </div>
            );
        }

        return null;
    };

    // Dropdown to select time range (Yearly, Monthly, Weekly, Daily)
    const TimeRangeSelection = () => {
        const [selectedRange, setSelectedRange] = useState('');

        const handleRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
            const selectedRange = event.target.value;
            setSelectedRange(selectedRange); // Update state here, NOT updateChartData
        };

        return (
            <>
                <select id="time-range-select" onChange={handleRangeChange} style={{ backgroundColor: 'gray', color: 'black' }}>
                    <option value="">Select Time Range</option>
                    <option value="yearly">Yearly</option>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                </select>

                {/* Conditionally render the range selector based on selected time range */}
                {selectedRange && <DynamicRangeSelection range={selectedRange} />}
            </>
        );
    };

    // Download options component
    const DownloadSelection = () => {
        const downloadImage = () => {
            const chart = chartRef.current;
            if (chart) {
                const link = document.createElement('a');
                link.href = (chart as any)?.toBase64Image(); // Convert to base64 image
                link.download = 'chart.png'; // Set file name
                link.click();
            }
        };

        const downloadCSV = () => {
            let csvContent = 'data:text/csv;charset=utf-8,';
            csvContent += ['Month', 'Sales'].join(',') + '\n'; // CSV header
            chartData.monthly.labels.forEach((label, index) => {
                csvContent += `${label},${chartData.monthly.datasets[0].data[index]}\n`; // CSV rows
            });

            const link = document.createElement('a');
            link.href = encodeURI(csvContent);
            link.download = 'chart-data.csv'; // Set file name
            link.click();
        };

        const downloadExcel = () => {
            const worksheet = XLSX.utils.json_to_sheet(chartData.monthly.labels.map((label, index) => ({
                Month: label,
                Sales: chartData.monthly.datasets[0].data[index],
            })));

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');

            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            saveAs(blob, 'chart-data.xlsx');
        };

        const handleDownloadSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
            const selectedOption = event.target.value;

            switch (selectedOption) {
                case 'image':
                    downloadImage();
                    break;
                case 'csv':
                    downloadCSV();
                    break;
                case 'excel':
                    downloadExcel();
                    break;
                default:
                    break;
            }
        };

        return (
            <select id="download-select" onChange={handleDownloadSelection} style={{ backgroundColor: 'gray', color: 'black' }}>
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
            <div style={{ margin: 0, padding: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'white' }}>
                    <div style={{ width: '90vw', height: '70vh', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', top: '-40px', left: '10px', right: '10px' }}>
                            {/* <FilterDate /> */}
                            <TimeRangeSelection /> {/* Dropdown to change the data */}
                            <DownloadSelection /> {/* Dropdown to download the chart */}
                        </div>
                        <Bar ref={chartRef} data={chartData.monthly} options={{ responsive: true, maintainAspectRatio: false }} /> {/* Initial data for the chart */}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ChartComponent;
