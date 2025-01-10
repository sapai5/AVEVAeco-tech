import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

interface DataPoint {
  entry: number;
  actual: number | null;
  predicted: number;
}

interface UseSocketReturn {
  socket: Socket | null;
  columns: string[];
  consoleOutput: string;
  accuracy: number | null;
  chartData: DataPoint[];
  targetColumn: string;
  error: string | null;
  isConnecting: boolean;
  handleSubmit: (column: string) => void;
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [consoleOutput, setConsoleOutput] = useState<string>('')
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [chartData, setChartData] = useState<DataPoint[]>([])
  const [targetColumn, setTargetColumn] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(true)

  useEffect(() => {
    let mounted = true;

    const connectToServer = () => {
      try {
        const newSocket = io('http://127.0.0.1:5000', {
          transports: ['websocket', 'polling'],
          upgrade: true,
          rememberUpgrade: true,
          withCredentials: false,
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
          timeout: 20000, // Increased timeout
          autoConnect: true
        })

        newSocket.on('connect', () => {
          if (mounted) {
            console.log('Connected to the websocket server.')
            setError(null)
            setIsConnecting(false)
          }
        })

        newSocket.on('connect_error', (err) => {
          if (mounted) {
            console.error('Connection error:', err)
            setError('Failed to connect to the server. Please ensure the backend is running on port 5000.')
            setIsConnecting(false)
          }
        })

        newSocket.on('available_columns', (data: { columns: string[] }) => {
          if (mounted) {
            console.log('Received columns:', data.columns)
            setColumns(data.columns)
          }
        })

        newSocket.on('console_output', (data: { message?: string; error?: string }) => {
          if (mounted) {
            console.log('Console output:', data)
            setConsoleOutput(data.message || data.error || '')
          }
        })

        newSocket.on('model_mae', (data: { mae: number }) => {
          if (mounted) {
            console.log('Received accuracy:', data.mae)
            setAccuracy(data.mae)
          }
        })

        newSocket.on('new_plot', (data: { data: DataPoint[], column: string }) => {
          if (mounted) {
            console.log('Received plot data:', data)
            setChartData(data.data)
            setTargetColumn(data.column)
          }
        })

        newSocket.on('error', (error: any) => {
          if (mounted) {
            console.error('Socket error:', error)
            const errorMessage = typeof error === 'string' ? error : error.message || 'An unknown error occurred'
            setError(errorMessage)
          }
        })

        newSocket.on('disconnect', (reason) => {
          if (mounted) {
            console.log('Disconnected:', reason)
            setError(`Disconnected from server: ${reason}`)
            setIsConnecting(true)
            
            if (reason === 'io server disconnect') {
              newSocket.connect()
            }
          }
        })

        setSocket(newSocket)

        return newSocket;
      } catch (err) {
        console.error('Socket initialization error:', err)
        if (mounted) {
          setError('Failed to initialize socket connection')
        }
        return null
      }
    }

    const newSocket = connectToServer()

    return () => {
      mounted = false;
      if (newSocket) {
        newSocket.removeAllListeners()
        newSocket.disconnect()
      }
    }
  }, [])

  const handleSubmit = (column: string) => {
    if (socket) {
      try {
        console.log('Submitting column:', column)
        // Clear previous data
        setChartData([])
        setAccuracy(null)
        setError(null)
        setConsoleOutput('')
        
        socket.emit('process_data', { target_column: column })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send data to server'
        setError(errorMessage)
      }
    }
  }

  return {
    socket,
    columns,
    consoleOutput,
    accuracy,
    chartData,
    targetColumn,
    error,
    isConnecting,
    handleSubmit
  }
}

