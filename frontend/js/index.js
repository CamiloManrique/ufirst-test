import { appendToAggregation, legendHoverHandler, tooltipPercentage } from './utils';
import dateFormat from "dateformat";
import Chart from 'chart.js/auto';
import * as d3 from 'd3';

const baseUrl = process.env.API_URL;

function processData(data, reducersMap) {
    const reducers = Object.entries(reducersMap);
    return data.reduce((acc, entry) => {
        reducers.forEach(([ key, reducerFn ]) => {
            acc[key] = reducerFn(acc[key], entry);
        });
        return acc;
    }, {})
}

(async () => {
    const response = await fetch(`${baseUrl}/data`);
    const json = await response.json();

    const reducersMap = {
        requestsPerMinute: (acc = [], d) => {
            const date = new Date();
            date.setDate(d.datetime.day)
            date.setHours(d.datetime.hour)
            date.setMinutes(d.datetime.minute)
            date.setSeconds(d.datetime.second)
            acc.push(date);
            return acc;
        },
        methods: (acc = [], d) => appendToAggregation(acc, d, 'request.method'),
        statusCodes: (acc = [], d) => appendToAggregation(acc, d, 'response_code'),
        docSize: (acc = [], d) => {
            const size = parseInt(d.document_size);
            if(size > 200 && size < 1000) {
                acc.push(d.document_size);
            }
            return acc;
        }
    }

    const processedData = processData(json, reducersMap);

    function histogramInterval(minuteInterval = 30) {
        return (data, min, max) => {
            return d3.scaleTime().domain([min, max]).ticks(d3.utcMinute.every(minuteInterval));
        };
    }

    function createRequestsPerMinuteChart() {
        const xValues = processedData.requestsPerMinute;
        const range = d3.range(xValues.length);

        const minuteInterval = 10;

        // Compute bins.
        const bins = d3.bin().thresholds(histogramInterval(minuteInterval)).value(i => xValues[i])(range);

        const format = 'mm/dd HH:MM'

        const labels = bins.map(b => dateFormat(b.x0, format))
        const values = bins.map(b => b.length/minuteInterval);

        const ctx = document.getElementById('requestsPerMinuteChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Number of requests per minute',
                    data: values,
                    borderWidth: 1,
                    borderColor: 'rgb(24,215,18)',
                    backgroundColor: 'rgb(24,215,18, 0.3)'
                }]
            },
            options: {
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date and time (EDT)',
                            font: {
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        });
    }

    function createMethodsDistributionChart() {
        const methodsAggregation = processedData.methods;

        const ctx = document.getElementById('methodChart').getContext('2d');

        const labels = methodsAggregation.map(agg => agg.field)
            .map(label => label === 'nullField' ? 'No method (invalid request)' : label);
        const values = methodsAggregation.map(agg => agg.count);
        const total = values.reduce((acc, v) => acc += v, 0);

        console.log('lab', labels);
        console.log('vals', values);

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    label: 'Methods distribution',
                    data: values,
                    backgroundColor: [
                        'rgb(255, 99, 132)',
                        'rgb(54, 162, 235)',
                        'rgb(255, 205, 86)',
                        'rgb(96,95,95)'
                    ]
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Number of requests per HTTP method'
                    },
                    legend: {
                        onHover: (evt, legendItem) => legendHoverHandler(chart, legendItem)
                    },
                    tooltip: {
                        callbacks: {
                            footer: (tooltipItems) => tooltipPercentage(tooltipItems[0], total)
                        }
                    }
                },
            }
        });
    }

    function createStatusCodesChart() {

        const statusAggregation = processedData.statusCodes;

        const ctx = document.getElementById('responseCodeChart').getContext('2d');

        const labels = statusAggregation.map(agg => agg.field);
        const values = statusAggregation.map(agg => agg.count);
        const total = values.reduce((acc, v) => acc += v, 0);

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    label: 'Response codes distribution',
                    data: values,
                    backgroundColor: [
                        'rgb(24,215,18, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(255, 205, 86, 0.7)',
                        'rgb(197,26,123, 0.7)',
                        'rgb(229,54,235, 0.7)',
                        'rgb(128,2,2, 0.7)',
                        'rgb(241,8,8, 0.7)',
                        'rgba(71,70,72,0.7)'
                    ]
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Number of responses per status code'
                    },
                    legend: {
                        onHover: (evt, legendItem) => legendHoverHandler(chart, legendItem)
                    },
                    tooltip: {
                        callbacks: {
                            footer: (tooltipItems) => tooltipPercentage(tooltipItems[0], total)
                        }
                    }
                }
            }
        });
    }

    function createDocSizeChart() {
        const xValues = processedData.docSize;
        const range = d3.range(xValues.length);

        const bins = d3.bin().value(i => xValues[i])(range);

        const labels = bins.map(b => `${b.x0} - ${b.x1}`);
        const values = bins.map(b => b.length);

        const ctx = document.getElementById('documentSizeChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Number of responses',
                    data: values,
                    backgroundColor: [
                        'rgba(50,222,222,0.4)'
                    ],
                    borderColor: [
                        'rgb(75, 192, 192)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribution of responses between 200 and 1000 bytes'
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Document size (bytes)',
                            font: {
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        });
    }

    createRequestsPerMinuteChart();
    createMethodsDistributionChart();
    createStatusCodesChart();
    createDocSizeChart()
})();
