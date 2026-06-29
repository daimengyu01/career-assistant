import React, { useState, useEffect } from 'react';

const Diagnostic: React.FC = () => {
  const [info, setInfo] = useState<any>({});

  useEffect(() => {
    try {
      setInfo({
        reactVersion: React.version,
        nodeEnv: (window as any).process?.env?.NODE_ENV || 'unknown',
        url: window.location.href,
        title: document.title,
      });
    } catch (e) {
      setInfo({ error: String(e) });
    }
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  const handleNavigateHome = () => {
    window.location.href = '/home';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ color: '#667eea', textAlign: 'center', marginBottom: '10px' }}>
          🔍 CareerAssistant 诊断
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '25px' }}>
          React 渲染与环境检测
        </p>

        <div style={{
          background: '#f0f9ff',
          borderLeft: '4px solid #667eea',
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '8px'
        }}>
          <div style={{ margin: '8px 0' }}>
            <strong>React 版本：</strong>{info.reactVersion || '检测中...'}
          </div>
          <div style={{ margin: '8px 0' }}>
            <strong>运行环境：</strong>{info.nodeEnv || '检测中...'}
          </div>
          <div style={{ margin: '8px 0' }}>
            <strong>页面标题：</strong>{info.title || '检测中...'}
          </div>
          <div style={{ margin: '8px 0' }}>
            <strong>当前 URL：</strong>{info.url || '检测中...'}
          </div>
        </div>

        {info.error && (
          <div style={{
            background: '#fee',
            borderLeft: '4px solid #e74c3c',
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '8px',
            color: '#c0392b'
          }}>
            <strong>错误信息：</strong>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', marginTop: '8px' }}>
              {info.error}
            </pre>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleReload}
            style={{
              flex: 1,
              padding: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🔄 刷新诊断
          </button>
          <button
            onClick={handleNavigateHome}
            style={{
              flex: 1,
              padding: '12px',
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🏠 进入首页
          </button>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#fff8e1',
          borderLeft: '4px solid #ffc107',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#5c4a00'
        }}>
          <strong>💡 说明：</strong><br/>
          如果能看到此页面，说明 React 已正常渲染。<br/>
          如果仍为空白，请查看 DevTools Console 的红色报错。
        </div>
      </div>
    </div>
  );
};

export default Diagnostic;
