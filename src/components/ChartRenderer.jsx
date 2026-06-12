import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ComposedChart
} from 'recharts';

const COLORS = ['var(--color-accent)', 'var(--color-accent-hover)', '#14b8a6', '#f59e0b', '#ef4444', '#2563eb'];

const axisProps = {
  stroke: 'var(--color-text-secondary)',
  style: { fontSize: '0.75rem' },
};

const tooltipProps = {
  contentStyle: {
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    color: 'var(--color-text-primary)',
  },
  labelStyle: { color: 'var(--color-text-primary)' },
  itemStyle: { color: 'var(--color-text-primary)' },
};

const ChartRenderer = ({ type, data, title, xKey, yKey, height = 300 }) => {
  // Debug logging
  console.log('[ChartRenderer] Received:', { type, data, title, dataType: typeof data });
  
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

  const renderChart = () => {
    switch (type) {
      case 'bar':
      case 'column':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey={xKey || 'name'} {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              <Legend wrapperStyle={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }} />
              <Bar dataKey={yKey || 'value'} fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'stacked':
        // For stacked bars, data should have multiple value keys
        const valueKeys = Object.keys(data[0] || {}).filter(key => key !== 'name' && key !== (xKey || 'name'));
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey={xKey || 'name'} 
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '0.875rem' }}
              />
              <YAxis 
                stroke="var(--color-text-secondary)"
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
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey={xKey || 'name'} {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              <Legend wrapperStyle={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }} />
              <Line 
                type="monotone" 
                dataKey={yKey || 'value'} 
                stroke="var(--color-accent)" 
                strokeWidth={3}
                dot={{ fill: 'var(--color-accent)', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                type="number"
                dataKey={xKey || 'x'} 
                name={xKey || 'X'}
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '0.875rem' }}
              />
              <YAxis 
                type="number"
                dataKey={yKey || 'y'} 
                name={yKey || 'Y'}
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '0.875rem' }}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} {...tooltipProps} />
              <Legend />
              <Scatter name="Data Points" data={data} fill="var(--color-accent)" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'pie':
      case 'donut':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={type === 'donut' ? '72%' : '72%'}
                innerRadius={type === 'donut' ? '42%' : 0}
                fill="#8884d8"
                dataKey={yKey || 'value'}
                stroke="var(--color-bg-secondary)"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipProps} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey={xKey || 'name'} {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              <Legend wrapperStyle={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }} />
              <Area 
                type="monotone" 
                dataKey={yKey || 'value'} 
                stroke="var(--color-accent)" 
                fill="var(--color-accent)"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <RadarChart data={data}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis 
                dataKey={xKey || 'name'} 
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '0.875rem' }}
              />
              <PolarRadiusAxis 
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '0.875rem' }}
              />
              <Radar 
                name="Values" 
                dataKey={yKey || 'value'} 
                stroke="var(--color-accent)" 
                fill="var(--color-accent)" 
                fillOpacity={0.6} 
              />
              <Tooltip {...tooltipProps} />
            </RadarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="chart-container" style={{ 
      margin: '1.5rem 0',
      padding: '1.5rem',
      backgroundColor: 'var(--color-bg-secondary)',
      borderRadius: '8px',
      boxShadow: 'var(--shadow-sm)',
      minHeight: height + 80
    }}>
      {title && (
        <h4 style={{ 
          marginBottom: '1rem',
          color: 'var(--color-text-primary)',
          fontSize: '1rem',
          fontWeight: 600
        }}>
          {title}
        </h4>
      )}
      <div style={{ 
        width: '100%', 
        height: height,
        overflow: 'auto'
      }}>
        {renderChart()}
      </div>
    </div>
  );
};

export default ChartRenderer;
