// Export sessions to JSON file
export const exportSessions = (sessions, messages = {}) => {
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    sessions: sessions.map(session => ({
      ...session,
      messages: messages[session.$id] || []
    }))
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `lastweek-sessions-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export single session
export const exportSession = (session, messages = []) => {
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    session: {
      ...session,
      messages
    }
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${session.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export as Markdown
export const exportSessionAsMarkdown = (session, messages = []) => {
  let markdown = `# ${session.title}\n\n`;
  markdown += `**Subject:** ${session.subject}\n`;
  markdown += `**Mode:** ${session.mode}\n`;
  markdown += `**Created:** ${new Date(session.createdAt).toLocaleString()}\n\n`;
  markdown += `---\n\n`;
  
  messages.forEach(msg => {
    const role = msg.role === 'user' ? '👤 You' : '🤖 AI';
    markdown += `## ${role}\n\n`;
    markdown += `${msg.content}\n\n`;
    markdown += `---\n\n`;
  });

  const dataBlob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${session.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Import sessions from JSON file
export const importSessions = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate data structure
        if (!data.version || !data.sessions) {
          throw new Error('Invalid export file format');
        }
        
        resolve(data.sessions);
      } catch (error) {
        reject(new Error('Failed to parse import file: ' + error.message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

// Export statistics as CSV
export const exportStatisticsAsCSV = (sessions) => {
  const headers = ['Title', 'Subject', 'Mode', 'Created', 'Updated', 'Message Count'];
  const rows = sessions.map(session => [
    session.title,
    session.subject,
    session.mode,
    new Date(session.createdAt).toLocaleString(),
    new Date(session.updatedAt).toLocaleString(),
    session.messageCount || 0
  ]);

  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.map(cell => `"${cell}"`).join(',') + '\n';
  });

  const dataBlob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `lastweek-statistics-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
