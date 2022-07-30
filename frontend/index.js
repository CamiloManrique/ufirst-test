const baseUrl = 'http://localhost:8000';

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/histogram
function Histogram(data, {
    value = d => d, // convenience alias for x
    domain, // convenience alias for xDomain
    label, // convenience alias for xLabel
    format, // convenience alias for xFormat
    type = d3.scaleLinear, // convenience alias for xType
    x = value, // given d in data, returns the (quantitative) x-value
    y = () => 1, // given d in data, returns the (quantitative) weight
    thresholds = 40, // approximate number of bins to generate, or threshold function
    normalize, // whether to normalize values to a total of 100%
    marginTop = 20, // top margin, in pixels
    marginRight = 30, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 40, // left margin, in pixels
    width = 640, // outer width of chart, in pixels
    height = 400, // outer height of chart, in pixels
    insetLeft = 0.5, // inset left edge of bar
    insetRight = 0.5, // inset right edge of bar
    xType = type, // type of x-scale
    xDomain = domain, // [xmin, xmax]
    xRange = [marginLeft, width - marginRight], // [left, right]
    xLabel = label, // a label for the x-axis
    xFormat = format, // a format specifier string for the x-axis
    yType = d3.scaleLinear, // type of y-scale
    yDomain, // [ymin, ymax]
    yRange = [height - marginBottom, marginTop], // [bottom, top]
    yLabel = "↑ Frequency", // a label for the y-axis
    yFormat = normalize ? "%" : undefined, // a format specifier string for the y-axis
    color = "currentColor" // bar fill color
} = {}) {
    // Compute values.
    const X = d3.map(data, x);
    const Y0 = d3.map(data, y);
    const I = d3.range(X.length);

    // Compute bins.
    const bins = d3.bin().thresholds(thresholds).value(i => X[i])(I);
    const Y = Array.from(bins, I => d3.sum(I, i => Y0[i]));
    if (normalize) {
        const total = d3.sum(Y);
        for (let i = 0; i < Y.length; ++i) Y[i] /= total;
    }

    // Compute default domains.
    if (xDomain === undefined) xDomain = [bins[0].x0, bins[bins.length - 1].x1];
    if (yDomain === undefined) yDomain = [0, d3.max(Y)];

    // Construct scales and axes.
    const xScale = xType(xDomain, xRange);
    const yScale = yType(yDomain, yRange);

    const xAxis = d3.axisBottom(xScale).ticks(width / 80, xFormat).tickSizeOuter(0);
    const yAxis = d3.axisLeft(yScale).ticks(height / 40, yFormat);
    yFormat = yScale.tickFormat(100, yFormat);

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(yAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", -marginLeft)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(yLabel));

    svg.append("g")
        .attr("fill", color)
        .selectAll("rect")
        .data(bins)
        .join("rect")
        .attr("x", d => xScale(d.x0) + insetLeft)
        .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - insetLeft - insetRight))
        .attr("y", (d, i) => yScale(Y[i]))
        .attr("height", (d, i) => yScale(0) - yScale(Y[i]))
        .append("title")
        .text((d, i) => [`${d.x0} ≤ x < ${d.x1}`, yFormat(Y[i])].join("\n"));

    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis)
        .call(g => g.append("text")
            .attr("x", width - marginRight)
            .attr("y", 27)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text(xLabel));

    return svg.node();
}

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/bar-chart
function BarChart(data, {
    x = (d, i) => i, // given d in data, returns the (ordinal) x-value
    y = d => d, // given d in data, returns the (quantitative) y-value
    title, // given d in data, returns the title text
    marginTop = 20, // the top margin, in pixels
    marginRight = 0, // the right margin, in pixels
    marginBottom = 30, // the bottom margin, in pixels
    marginLeft = 40, // the left margin, in pixels
    width = 640, // the outer width of the chart, in pixels
    height = 400, // the outer height of the chart, in pixels
    xDomain, // an array of (ordinal) x-values
    xRange = [marginLeft, width - marginRight], // [left, right]
    yType = d3.scaleLinear, // y-scale type
    yDomain, // [ymin, ymax]
    yRange = [height - marginBottom, marginTop], // [bottom, top]
    xPadding = 0.1, // amount of x-range to reserve to separate bars
    yFormat, // a format specifier string for the y-axis
    yLabel, // a label for the y-axis
    color = "currentColor" // bar fill color
} = {}) {
    // Compute values.
    const X = d3.map(data, x);
    const Y = d3.map(data, y);

    // Compute default domains, and unique the x-domain.
    if (xDomain === undefined) xDomain = X;
    if (yDomain === undefined) yDomain = [0, d3.max(Y)];
    xDomain = new d3.InternSet(xDomain);

    // Omit any data not present in the x-domain.
    const I = d3.range(X.length).filter(i => xDomain.has(X[i]));

    // Construct scales, axes, and formats.
    const xScale = d3.scaleBand(xDomain, xRange).padding(xPadding);
    const yScale = yType(yDomain, yRange);
    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
    const yAxis = d3.axisLeft(yScale).ticks(height / 40, yFormat);

    // Compute titles.
    if (title === undefined) {
        const formatValue = yScale.tickFormat(100, yFormat);
        title = i => `${X[i]}\n${formatValue(Y[i])}`;
    } else {
        const O = d3.map(data, d => d);
        const T = title;
        title = i => T(O[i], i, data);
    }

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(yAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", -marginLeft)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(yLabel));

    const bar = svg.append("g")
        .attr("fill", color)
        .selectAll("rect")
        .data(I)
        .join("rect")
        .attr("x", i => xScale(X[i]))
        .attr("y", i => yScale(Y[i]))
        .attr("height", i => yScale(0) - yScale(Y[i]))
        .attr("width", xScale.bandwidth());

    if (title) bar.append("title")
        .text(title);

    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis);

    return svg.node();
}

(async () => {
    const response = await fetch(`${baseUrl}/data`);
    const json = await response.json();

    function thresholdTime(n) {
        return (data, min, max) => {
            return d3.scaleLinear().domain([min, max]).ticks(n);
        };
    }

    function histogramInterval(interval = 60000) {
        return (data, min, max) => {
            const diff = max.getTime() - min.getTime();
            const n = Math.ceil(diff/interval);
            return d3.scaleTime().domain([min, max]).ticks(n);
        };
    }


    const reqPerMinuteChart = Histogram(json, {
        value: d => {
            // TODO: Watch out for the timezones!!
            const date = new Date();
            date.setDate(d.datetime.day)
            date.setHours(d.datetime.hour)
            date.setMinutes(d.datetime.minute)
            date.setSeconds(d.datetime.second)
            return date;
        },
        type: d3.scaleTime,
        label: "Requests per minute",
        width: 1000,
        height: 500,
        color: "steelblue",
        thresholds: histogramInterval(60000 * 60),
        yLabel: 'Number of requests'
    });

    const methodsAggregation = json.reduce((acc, data) => {
        const { method } = data.request;
        const idx = acc.findIndex(entry => entry.method === method);
        const obj = idx !== -1 ? acc[idx] : { method, count: 0 };
        obj.count += 1;
        if (idx !== -1) {
            acc[idx] = obj;
        } else {
            acc.push(obj);
        }
        return acc;
    }, []);


    const statusAggregation = json.reduce((acc, data) => {
        const { response_code } = data;
        const idx = acc.findIndex(entry => entry.response_code === response_code);
        const obj = idx !== -1 ? acc[idx] : { response_code, count: 0 };
        obj.count += 1;
        if (idx !== -1) {
            acc[idx] = obj;
        } else {
            acc.push(obj);
        }
        return acc;
    }, []);

    const methodsChart = BarChart(methodsAggregation, {
        x: d => d.method,
        y: d => d.count,
        label: 'Methods distribution',
        width: 1000,
        height: 500,
        color: 'yellow',
        yLabel: 'Frequency',
    });

    const responseCodeChart = BarChart(statusAggregation, {
        x: d => d.response_code,
        y: d => d.count,
        label: 'Status codes distribution',
        width: 1000,
        height: 500,
        color: 'yellow',
        yLabel: 'Frequency',
    });

    const filterResponseSize = json.filter(data => {
        const size = parseInt(data.document_size);
        return size > 200 && size < 1000;
    })

    const docSizeChart = Histogram(filterResponseSize, {
        x: d => parseInt(d.document_size),
        label: 'Response size distribution',
        width: 1000,
        height: 500,
        color: 'yellow',
        yLabel: 'Frequency',
        //thresholds: thresholdTime(20)
    });

    document.getElementById('methodChart').append(methodsChart);

    document.getElementById('requestsPerMinuteChart').append(reqPerMinuteChart);

    document.getElementById('responseCodeChart').append(responseCodeChart);

    document.getElementById('documentSizeChart').append(docSizeChart);
})();
