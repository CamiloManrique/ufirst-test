'use strict';

function getByPath(object, path){
    return path.split('.').reduce ( (res, prop) => res[prop], object );
}

export function appendToAggregation(acc, data, path) {
    const field = getByPath(data, path) || 'nullField';
    const idx = acc.findIndex(entry => entry.field === field);
    const obj = idx !== -1 ? acc[idx] : {field, count: 0};
    obj.count += 1;
    if (idx !== -1) {
        acc[idx] = obj;
    } else {
        acc.push(obj);
    }
    return acc;
}

export function legendHoverHandler(chart, legendItem) {
    const index = chart.data.labels.indexOf(legendItem.text);
    const activeSegment = chart.getDatasetMeta(0).data[index];
    chart.setActiveElements([
        { datasetIndex: 0, index: activeSegment.$context.index }
    ]);
    chart.tooltip.setActiveElements([
        { datasetIndex: 0, index: activeSegment.$context.index }
    ],{
        x: (chart.chartArea.left + chart.chartArea.right) / 2,
        y: (chart.chartArea.top + chart.chartArea.bottom) / 2,
    });
    chart.update();
}

export function tooltipPercentage(tooltipItem, total) {
    const value = tooltipItem.parsed;
    return `${(value * 100/total).toFixed(2)}%`;
}
