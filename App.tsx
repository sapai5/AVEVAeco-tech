import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import ColumnSelector from './components/ColumnSelector';
import ConsoleOutput from './components/ConsoleOutput';
import AccuracyDisplay from './components/AccuracyDisplay';
import Chart from './components/Chart';

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [chartImage, setChartImage] = useState<string>('');

  useEffect(() => {
    const newSocket = io('http://' + window.location.hostname + ':' + window.location.port);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to the websocket server.');
    });

    newSocket.on('available_columns', (data: { columns: string[] }) => {
      setColumns(data.columns);
    });

    newSocket.on('console_output', (data: { message?: string; error?: string }) => {
      setConsoleOutput(data.message || data.error || '');
    });

    newSocket.on('model_mae', (data: { mae: number }) => {
      setAccuracy(data.mae);
    });

    newSocket.on('new_plot', (data: { image_url: string }) => {
      setChartImage(data.image_url);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleSubmit = (column: string) => {
    if (socket) {
      socket.emit('process_data', { target_column: column });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">AI Model Predictions</h1>
      <ColumnSelector columns={columns} onSubmit={handleSubmit} />
      <ConsoleOutput output={consoleOutput} />
      <AccuracyDisplay accuracy={accuracy} />
      <Chart imageUrl={chartImage} />
    </div>
  );
};

export default App;

