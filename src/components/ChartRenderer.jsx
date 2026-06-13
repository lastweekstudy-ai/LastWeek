import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ComposedChart
} from 'recharts';

const COLORS = ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#84cc16'];
const CHART_COLORS = {
  text: '#cbd5e1',
  textStrong: '#f8fafc',
  grid: 'rgba(148, 163, 184, 0.24)',
  panel: 'rgba(15, 23, 42, 0.42)',
  border: 'rgba(139, 92, 246, 0.35)',
  tooltipBg: '#0f1020',
  primary: COLORS[0],
};

const axisProps = {
  stroke: CHART_COLORS.text,
  style: { fontSize: '0.75rem' },
};

const tooltipProps = {
  contentStyle: {
    backgroundColor: CHART_COLORS.tooltipBg,
    border: `1px solid ${CHART_COLORS.border}`,
    borderRadius: '12px',
    color: CHART_COLORS.textStrong,
  },
  labelStyle: { color: CHART_COLORS.textStrong },
  itemStyle: { color: CHART_COLORS.textStrong },
};

const parseChartNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[$,%\s,]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const getNumericKeys = (rows) => {
  const first = rows?.[0] || {};
  return Object.keys(first).filter((key) => {
    if (key === 'name') return false;
    return rows.some((row) => parseChartNumber(row?.[key]) !== null);
  });
};

const normalizeChartType = (type) => {
  const cleanType = String(type || 'bar').toLowerCase().trim();
  const aliases = {
    column: 'bar',
    histogram: 'bar',
    box: 'bar',
    boxplot: 'bar',
    'box-plot': 'bar',
    donut: 'donut',
    doughnut: 'donut',
    scatterplot: 'scatter',
    'scatter-plot': 'scatter',
    spider: 'radar',
    radial: 'radar',
  };

  return aliases[cleanType] || cleanType;
};

const ChartRenderer = ({ type, data, title, xKey, yKey, height = 300 }) => {
  const frameRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(720);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return undefined;

    const measure = () => {
      const width = Math.floor(node.getBoundingClientRect().width);
      if (width > 0) {
        setChartWidth(Math.max(260, width));
      }
    };

    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.map((row, index) => {
      const next = { ...row };
      if (next.name == null) {
        next.name = next.label ?? next.category ?? next.x ?? `Item ${index + 1}`;
      }

      Object.keys(next).forEach((key) => {
        const parsed = parseChartNumber(next[key]);
        if (parsed !== null) next[key] = parsed;
      });

      return next;
    });
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{
        margin: '1.5rem 0',
        padding: '1.5rem',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '8px',
        border: '2px dashed var(--color-border)',
        textAlign: 'center',
        color: 'var(--color-text-muted)'
      }}>
        <p>⚠️ Chart Error: No data provided</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Expected format: {`[{"name":"Category","value":number}]`}
        </p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>
          Debug: data={JSON.stringify(data)}, type={type}
        </p>
      </div>
    );
  }

  const chartType = normalizeChartType(type);
  const resolvedXKey = xKey || 'name';
  const numericKeys = getNumericKeys(chartData);
  const resolvedYKey = yKey || (
    numericKeys.includes('value') ? 'value' :
    numericKeys.includes('y') ? 'y' :
    numericKeys.includes('median') ? 'median' :
    numericKeys.includes('max') ? 'max' :
    numericKeys[0]
  );

  if (!resolvedYKey && !['scatter'].includes(chartType)) {
    return (
      <div className="chart-container chart-container-empty">
        <p>Chart data is missing a numeric value column.</p>
      </div>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
      case 'column':
        return (
            <BarChart width={chartWidth} height={height} data={chartData} margin={{ top: 16, right: 18, left: 4, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey={resolvedXKey} {...axisProps} interval={0} tickMargin={8} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              <Legend wrapperStyle={{ color: CHART_COLORS.text, fontSize: '0.75rem' }} />
              <Bar dataKey={resolvedYKey} fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} minPointSize={3} />
            </BarChart>
        );

      case 'stacked':
        // For stacked bars, data should have multiple value keys
        const valueKeys = Object.keys(chartData[0] || {}).filter(key => key !== 'name' && key !== resolvedXKey && parseChartNumber(chartData[0]?.[key]) !== null);
        return (
            <BarChart width={chartWidth} height={height} data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis 
                dataKey={resolvedXKey} 
                stroke={CHART_COLORS.text}
                style={{ fontSize: '0.875rem' }}
              />
              <YAxis 
                stroke={CHART_COLORS.text}
                style={{ fontSize: '0.875rem' }}
              />
              <Tooltip {...tooltipProps} />
              <Legend />
              {valueKeys.map((key, index) => (
                <Bar 
                  key={key} 
                  dataKey={key} 
                  stackId="a" 
                  fill={COLORS[index % COLORS.length]} 
                  radius={index === valueKeys.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
        );

      case 'line':
        return (
            <LineChart width={chartWidth} height={height} data={chartData} margin={{ top: 16, right: 18, left: 4, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey={resolvedXKey} {...axisProps} interval={0} tickMargin={8} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              <Legend wrapperStyle={{ color: CHART_COLORS.text, fontSize: '0.75rem' }} />
              <Line 
                type="monotone" 
                dataKey={resolvedYKey} 
                stroke={CHART_COLORS.primary} 
                strokeWidth={3}
                dot={{ fill: CHART_COLORS.primary, stroke: CHART_COLORS.panel, strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
        );

      case 'scatter':
        return (
            <ScatterChart width={chartWidth} height={height} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis 
                type="number"
                dataKey={xKey || 'x'} 
                name={xKey || 'X'}
                stroke={CHART_COLORS.text}
                style={{ fontSize: '0.875rem' }}
              />
              <YAxis 
                type="number"
                dataKey={yKey || 'y'} 
                name={yKey || 'Y'}
                stroke={CHART_COLORS.text}
                style={{ fontSize: '0.875rem' }}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} {...tooltipProps} />
              <Legend />
              <Scatter name="Data Points" data={chartData} fill={CHART_COLORS.primary} />
            </ScatterChart>
        );

      case 'pie':
      case 'donut':
        return (
            <PieChart width={chartWidth} height={height}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={chartType === 'donut' ? '72%' : '72%'}
                innerRadius={chartType === 'donut' ? '42%' : 0}
                fill="#8884d8"
                dataKey={resolvedYKey}
                stroke={CHART_COLORS.panel}
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipProps} />
            </PieChart>
        );

      case 'area':
        return (
            <AreaChart width={chartWidth} height={height} data={chartData} margin={{ top: 16, right: 18, left: 4, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey={resolvedXKey} {...axisProps} interval={0} tickMargin={8} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              <Legend wrapperStyle={{ color: CHART_COLORS.text, fontSize: '0.75rem' }} />
              <Area 
                type="monotone" 
                dataKey={resolvedYKey} 
                stroke={CHART_COLORS.primary} 
                fill={CHART_COLORS.primary}
                fillOpacity={0.35}
              />
            </AreaChart>
        );

      case 'radar':
        return (
            <RadarChart width={chartWidth} height={height} data={chartData}>
              <PolarGrid stroke={CHART_COLORS.grid} />
              <PolarAngleAxis 
                dataKey={resolvedXKey} 
                stroke={CHART_COLORS.text}
                style={{ fontSize: '0.875rem' }}
              />
              <PolarRadiusAxis 
                stroke={CHART_COLORS.text}
                style={{ fontSize: '0.875rem' }}
              />
              <Radar 
                name="Values" 
                dataKey={resolvedYKey} 
                stroke={CHART_COLORS.primary} 
                fill={CHART_COLORS.primary} 
                fillOpacity={0.6} 
              />
              <Tooltip {...tooltipProps} />
            </RadarChart>
        );

      default:
        return (
            <BarChart width={chartWidth} height={height} data={chartData} margin={{ top: 16, right: 18, left: 4, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey={resolvedXKey} {...axisProps} interval={0} tickMargin={8} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              <Legend wrapperStyle={{ color: CHART_COLORS.text, fontSize: '0.75rem' }} />
              <Bar dataKey={resolvedYKey} fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} minPointSize={3} />
            </BarChart>
        );
    }
  };

  return (
    <div className="chart-container" style={{ 
      margin: '1.5rem 0',
      padding: '1.5rem',
      backgroundColor: CHART_COLORS.panel,
      borderRadius: '8px',
      boxShadow: 'var(--shadow-sm)',
      border: `1px solid ${CHART_COLORS.border}`,
      minHeight: height + 80
    }}>
      {title && (
        <h4 style={{ 
          marginBottom: '1rem',
          color: CHART_COLORS.textStrong,
          fontSize: '1rem',
          fontWeight: 600
        }}>
          {title}
        </h4>
      )}
      <div ref={frameRef} style={{ 
        width: '100%', 
        height: height,
        overflow: 'hidden'
      }}>
        {renderChart()}
      </div>
    </div>
  );
};

export default ChartRenderer;
