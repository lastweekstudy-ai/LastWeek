import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ComposedChart
} from 'recharts';

const COLORS = ['#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87', '#3b0764'];

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
        // DEBUG: Try without ResponsiveContainer first
        return (
          <div style={{ width: '100%', height: height, overflow: 'auto' }}>
            <BarChart width={600} height={height} data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={xKey || 'name'} 
                stroke="#6b7280"
                style={{ fontSize: '0.875rem' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '0.875rem' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#1f2937'
                }}
              />
              <Legend 
                wrapperStyle={{ 
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}
              />
              <Bar dataKey={yKey || 'value'} fill="#a855f7" radius={[8, 8, 0, 0]} />
            </BarChart>
          </div>
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
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text-primary)'
                }}
              />
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
          <div style={{ width: '100%', height: height, overflow: 'auto' }}>
            <LineChart width={600} height={height} data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={xKey || 'name'} 
                stroke="#6b7280"
                style={{ fontSize: '0.875rem' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '0.875rem' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#1f2937'
                }}
              />
              <Legend 
                wrapperStyle={{ 
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}
              />
              <Line 
                type="monotone" 
                dataKey={yKey || 'value'} 
                stroke="#a855f7" 
                strokeWidth={3}
                dot={{ fill: '#a855f7', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </div>
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
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ 
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text-primary)'
                }}
              />
              <Legend />
              <Scatter name="Data Points" data={data} fill="#a855f7" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'pie':
      case 'donut':
        return (
          <div style={{ width: '100%', height: height, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
            <PieChart width={Math.min(600, height)} height={height}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={type === 'donut' ? 100 : 100}
                innerRadius={type === 'donut' ? 60 : 0}
                fill="#8884d8"
                dataKey={yKey || 'value'}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#1f2937'
                }}
              />
            </PieChart>
          </div>
        );

      case 'area':
        return (
          <div style={{ width: '100%', height: height, overflow: 'auto' }}>
            <AreaChart width={600} height={height} data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={xKey || 'name'} 
                stroke="#6b7280"
                style={{ fontSize: '0.875rem' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '0.875rem' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#1f2937'
                }}
              />
              <Legend 
                wrapperStyle={{ 
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}
              />
              <Area 
                type="monotone" 
                dataKey={yKey || 'value'} 
                stroke="#a855f7" 
                fill="#a855f7"
                fillOpacity={0.3}
              />
            </AreaChart>
          </div>
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
                stroke="#a855f7" 
                fill="#a855f7" 
                fillOpacity={0.6} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text-primary)'
                }}
              />
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
