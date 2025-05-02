import { useDropzone } from 'react-dropzone'
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import ProgressBar from './ProgressBar'
import ParsedPreview from './ParsedPreview'
import UploadIcon from '@mui/icons-material/Upload'
import DownloadIcon from '@mui/icons-material/Download'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function StepProgress({ currentStep, onStepClick, completedStep }) {
  const steps = [
    { id: 1, label: 'Select files' },
    { id: 2, label: 'Upload' },
    { id: 3, label: 'Process' },
    { id: 4, label: 'Results' },
  ]

  // Map currentStep string to step id
  const stepMap = {
    upload: 1,
    viewFileData: 2,
    execute: 3,
    process: 4,
  }

  const activeStep = stepMap[currentStep] || 1

  return (
    <div className="step-progress-container" style={{ marginBottom: '1.5rem' }}>
      <div className="step-progress-bar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        position: 'relative',
        margin: '0 1rem',
        paddingTop: '1rem',
        paddingBottom: '1rem',
      }}>
        {steps.map((step, index) => {
          const isClickable = step.id <= completedStep + 1
          return (
            <div key={step.id} className="step-item" style={{ textAlign: 'center', flex: 1, position: 'relative' }}>
              <div
                className={`step-circle ${step.id <= activeStep ? 'active' : ''}`}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: step.id <= activeStep ? '#ea580c' : '#d1d5db',
                  margin: '0 auto',
                  zIndex: 2,
                  position: 'relative',
                }}
              />
              {index !== steps.length - 1 && (
                <div
                  className={`step-line ${step.id < activeStep ? 'active' : ''}`}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '0%',
                    width: '100%',
                    height: '4px',
                    backgroundColor: step.id < activeStep ? '#ea580c' : '#d1d5db',
                    zIndex: 1,
                    transform: 'translateX(50%)',
                  }}
                />
              )}
              <div
                className="step-label"
                onClick={() => isClickable && onStepClick && onStepClick(step.id)}
                style={{
                  marginTop: '8px',
                  fontSize: '0.875rem',
                  color: step.id <= activeStep ? '#ea580c' : '#6b7280',
                  fontWeight: step.id === activeStep ? '600' : '400',
                  cursor: isClickable ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
              >
                {step.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function UploadComponent() {
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [parsedData, setParsedData] = useState([])
  const [step, setStep] = useState('upload')
  const [selectedOption, setSelectedOption] = useState('google_ads')
  const [selectedDataId, setSelectedDataId] = useState('Google')
  const [uploading, setUploading] = useState(false)
  const [uploadCompleted, setUploadCompleted] = useState(false)
  const [runStatusLoading, setRunStatusLoading] = useState(false)
  const [parsingLoading, setParsingLoading] = useState(false)
  const [executeProgress, setExecuteProgress] = useState(0)
  // const [executeIntervalId, setExecuteIntervalId] = useState(null)
  const [pollIntervalId, setPollIntervalId] = useState(null)
  const [executionCompleted, setExecutionCompleted] = useState(false)
  const [isFetchingAzureData, setIsFetchingAzureData] = useState(false)

  // Map step id to step string
  const stepIdToString = {
    1: 'upload',
    2: 'viewFileData',
    3: 'execute',
    4: 'process',
  }

  

  const handleStepClick = (stepId) => {
    const targetStep = stepIdToString[stepId]
    if (targetStep) {
      // Allow navigation only to completedStep + 1 or below
      if (stepId <= completedStep + 1) {
        setStep(targetStep)
      }
    }
  }

  const handleBackClick = () => {
    const currentStepId = Object.keys(stepIdToString).find(key => stepIdToString[key] === step)
    const prevStepId = parseInt(currentStepId) - 1
    if (prevStepId >= 1) {
      setStep(stepIdToString[prevStepId])
    }
  }

  const handleNextClick = () => {
    const currentStepId = Object.keys(stepIdToString).find(key => stepIdToString[key] === step)
    const nextStepId = parseInt(currentStepId) + 1
    if (nextStepId <= Object.keys(stepIdToString).length) {
      setStep(stepIdToString[nextStepId])
    }
  }

  const handleDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(parsedData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "ProcessedData")
  
    XLSX.writeFile(workbook, "final_output_processed_data.xlsx")
  }

  const uploadFileToAzure = async (file) => {
    setUploading(true)
    setUploadCompleted(false)
    setProgress(0)
  
    try {
      const containerName = import.meta.env.VITE_AZURE_CONTAINER_NAME
      const folderPath = import.meta.env.VITE_AZURE_UPLOAD_PATH
      const sasToken = import.meta.env.VITE_AZURE_SAS_TOKEN
      const accountName = import.meta.env.VITE_AZURE_ACCOUNT_NAME
  
      if (!sasToken || !accountName || !containerName || !folderPath) {
        throw toast.error("Azure config missing")
      }
  
      const blobName = `${folderPath}/${selectedOption}/${file.name}`
      const url = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}${sasToken}`
  
      const xhr = new XMLHttpRequest()
      xhr.open("PUT", url, true)
      xhr.setRequestHeader("x-ms-blob-type", "BlockBlob")
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream")
  
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setProgress(progress)
        }
      }
  
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadCompleted(true)
          setStep('execute')
        } else {
          toast.error(`Upload failed: ${xhr.statusText}`)
        }
        setUploading(false)
      }
  
      xhr.onerror = () => {
        toast.error("Network error during upload")
        setUploading(false)
      }
      xhr.send(file)
    } catch (error) {
      console.error("Upload to Azure failed:", error)
      toast.error(error.message || "Upload failed")
      setUploading(false)
    }
  }

  const handleExecuteClick = async () => {
    const validNotebooks = ['Google', 'Meta', 'Neilsen']
    if (!validNotebooks.includes(selectedDataId)) {
      toast.error(`Notebook for source "${selectedDataId}" not found.`)
      return
    }
    setRunStatusLoading(true); // Disable button immediately on click
    try {
      const response = await fetch('http://localhost:3001/run-notebook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          source: selectedDataId,
        }),
      });
  
      const result = await response.json();
      if (response.ok) {
        console.log("Notebook execution result:", result);
        if (!result.run_id) {
          toast.error('No runId returned from notebook execution.');
          setRunStatusLoading(false);
          return;
        }
        setExecuteProgress(0);
        setExecutionCompleted(false);
        
  
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`http://localhost:3001/run-status/${result.run_id}`);
            const statusResult = await statusResponse.json();
            if (statusResponse.ok) {
              console.log("Run status:", statusResult);
  
              if (statusResult.status === 'completed') {
                clearInterval(pollInterval);
                setExecuteProgress(100);
                setRunStatusLoading(false);
                setExecutionCompleted(true);
                setStep('process');
                toast.success('Notebook run completed successfully!');
              } else if (statusResult.status === 'failed') {
                clearInterval(pollInterval);
                setExecuteProgress(0);
                setRunStatusLoading(false);
                toast.error('Notebook run failed.');
              } else {
                // Directly update progress from the backend response
                if (typeof statusResult.progress === 'number') {
                  setExecuteProgress(statusResult.progress);
                }
              }
            } else {
              console.error('Failed to get run status:', statusResult);
            }
          } catch (pollError) {
            console.error('Error polling run status:', pollError);
          }
        }, 3000);
        
        setPollIntervalId(pollInterval);
      } else {
        console.error('Notebook execution failed:', result);
        toast.error('Notebook execution failed.');
        setRunStatusLoading(false);
      }
    } catch (error) {
      console.error('Error executing notebook:', error);
      toast.error('An error occurred while executing the notebook.');
      setRunStatusLoading(false);
    }
  };

  useEffect(() => {
    if (step !== 'execute') {
      setExecuteProgress(0);
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
        setPollIntervalId(null);
      }
    }
  }, [step]);
  
  useEffect(() => {
    return () => {
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
      }
    };
  }, [pollIntervalId]);
  
  useEffect(() => {
    const fetchProcessedData = async () => {
      if (step === 'process') {
        try {
          const accountName = import.meta.env.VITE_AZURE_ACCOUNT_NAME
          const containerName = import.meta.env.VITE_AZURE_CONTAINER_NAME
          const sasToken = import.meta.env.VITE_AZURE_SAS_TOKEN
          const outputPath = import.meta.env.VITE_AZURE_OUTPUT_PATH || 'output/MMM_Data_Cube/MMM_Data_Cube'
          if (!accountName || !containerName || !sasToken) {
            throw new Error('Azure storage configuration missing')
          }
          const url = `https://${accountName}.blob.core.windows.net/${containerName}/${outputPath}.csv${sasToken}`
          
          const response = await fetch(url)
          if (!response.ok) {
            throw new Error(`Failed to fetch processed data: ${response.statusText}`)
          }
          const csvText = await response.text()
          const workbook = XLSX.read(csvText, { type: 'string' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          setParsedData(jsonData)
        } catch (error) {
          console.error('Error fetching processed data:', error)
          toast.error('Failed to load processed data.')
        }
      }
    }
    fetchProcessedData()
  }, [step])

  const onDrop = (acceptedFiles) => {
    const excelFile = acceptedFiles[0]
    setFile(excelFile)
    setProgress(0)
    setParsingLoading(true)
    setStep('viewFileData')

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        setProgress(40)
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        setProgress(100)
        setParsedData(jsonData)
        setParsingLoading(false)
      } catch (error) {
        console.error("Error parsing the file:", error)
        setProgress(0)
        setParsingLoading(false)
        toast.error("Failed to parse the Excel file.")
      }
    }

    reader.readAsArrayBuffer(excelFile)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: '.xlsx,.csv',
    onDropRejected: () => toast.error('Please upload a valid Excel or CSV file.')
  })

  const currentStepId = Object.keys(stepIdToString).find(key => stepIdToString[key] === step)
  const isFirstStep = currentStepId === '1'
  const isLastStep = currentStepId === '4'

  // Determine the highest completed step id based on current state
  let completedStep = 0
  if (parsedData.length > 0) {
    completedStep = 1
  }
  if (uploadCompleted) {
    completedStep = 2
  }
  if (executionCompleted) {
    completedStep = 3
  }
  if (step === 'process') {
    completedStep = 4
  }

  // Determine if next button should be disabled based on current step and process completion
  let isNextDisabled = false
  if (step === 'upload') {
    isNextDisabled = parsedData.length === 0
  } else if (step === 'viewFileData') {
    isNextDisabled = !uploadCompleted || uploading
  } else if (step === 'execute') {
    isNextDisabled = !executionCompleted || runStatusLoading
  } else if (step === 'process') {
    isNextDisabled = true
  }

  return (
    <div className="upload-container min-h-screen flex items-center justify-center bg-gray-50">
      <ToastContainer />
      <div className="upload-card" style={{ width: '100%', maxWidth: '100%' }}>
        <StepProgress currentStep={step} onStepClick={handleStepClick} completedStep={completedStep} />
        <div className="navigation-buttons" style={{ display: 'flex', justifyContent: step === 'upload' ? 'flex-end' : 'space-between', marginBottom: '1rem', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: step === 'upload' ? 'flex-end' : 'space-between', marginBottom: '1rem' }}>
            {!isFirstStep && (
              <button
                onClick={handleBackClick}
                className={`back-button mb-2 px-3 py-1 bg-gray-300 rounded disabled:cursor-not-allowed disabled:hover:bg-gray-300 ${step !== 'execute' ? 'btn-nav hover:bg-gray-400' : ''}`}
                disabled={runStatusLoading}
              >
                <ArrowBackIcon style={{ marginRight: '0.5rem' }} />
                Back
              </button>
            )}
            {step === 'viewFileData' ? (
              uploadCompleted ? (
                <button
                  onClick={handleNextClick}
                  className={`next-button-top mb-2 px-3 py-1 bg-blue-600 text-white rounded disabled:cursor-not-allowed disabled:hover:bg-blue-600 ${step !== 'execute' && !isNextDisabled && !runStatusLoading ? 'btn-nav hover:bg-blue-700' : ''}`}
                  disabled={isNextDisabled || runStatusLoading}
                >
                  Next
                  <ArrowForwardIcon style={{ marginLeft: '0.5rem' }} />
                </button>
              ) : (
                <button
                  onClick={() => uploadFileToAzure(file)}
                  className="next-button px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 relative overflow-hidden"
                  disabled={uploading}
                  style={{ position: 'relative' }}
                >
                  <UploadIcon style={{ marginRight: '0.5rem' }} />
                  <span style={{ position: 'relative', zIndex: 2 }}>
                    {uploading ? `Uploading... ${progress}%` : 'Next: Upload to Azure'}
                  </span>
                  {uploading && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        width: `${progress}%`,
                        backgroundColor: '#ea580c4d',
                        zIndex: 1,
                        transition: 'width 0.3s ease',
                        borderRadius: '0.375rem',
                      }}
                    />
                  )}
                </button>
              )
            ) : (
              !isLastStep && (
                <button
                  onClick={handleNextClick}
                  className={`next-button-top mb-2 px-3 py-1 bg-blue-600 text-white rounded disabled:cursor-not-allowed disabled:hover:bg-blue-600 ${!isNextDisabled && !runStatusLoading ? 'btn-nav hover:bg-blue-700' : ''}`}
                  disabled={isNextDisabled || runStatusLoading}
                >
                  Next
                  <ArrowForwardIcon style={{ marginLeft: '0.5rem' }} />
                </button>
              )
            )}
          </div>
          <hr style={{ border: '1px solid #f0efef', width: '100%' }} />
        </div>
        {step === 'upload' && (
          <>
            <div className="select-wrapper mt-4">
              <label htmlFor="selectOption" className="select-label">
                Choose your data source:
              </label>
              <select
                id="selectOption"
                value={selectedOption}
                onChange={(e) => {
                  const selectedIndex = e.target.selectedIndex
                  const dataId = e.target.options[selectedIndex].getAttribute('data-id')
                  setSelectedOption(e.target.value)
                  setSelectedDataId(dataId)
                }}
                className="select-input"
              >
                <option value="google_ads" data-id="Google">Google Ads</option>
                <option value="meta" data-id="Meta">Meta</option>
                <option value="neilsen" data-id="Neilsen">Neilsen</option>
              </select>
            </div>
            <div
              {...getRootProps()}
              className={`upload-dropzone ${isDragActive ? 'active' : ''}`}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the file here ...</p>
              ) : (
                <p>Drag 'n' drop an Excel or CSV file here, or click to select file</p>
              )}
            </div>
          </>
        )}

        {step === 'viewFileData' && (
          <>
            {parsingLoading ? (
              <div className="spinner-wrapper" style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                <div className="spinner-border" role="status" style={{
                  width: '3rem',
                  height: '3rem',
                  border: '0.4em solid #f3f3f3',
                  borderTop: '0.4em solid #ea580c',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              </div>
            ) : ( 
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <ParsedPreview data={parsedData} />
                </div>
              </>
            )}
          </>
        )}

        {step === 'execute' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0 1rem' }}>
              <div style={{ flex: 1 }}>
                <h3>File Information</h3>
                <p><strong>Filename:</strong> {file ? file.name : 'N/A'}</p>
                <p><strong>File Size:</strong> {file ? (file.size / 1024).toFixed(2) + ' KB' : 'N/A'}</p>
                <p><strong>Rows:</strong> {parsedData.length}</p>
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <h3>Logs</h3>
                <p>
                  {runStatusLoading
                    ? `Processing row ${Math.floor((executeProgress / 100) * parsedData.length)} of ${parsedData.length}`
                    : 'Logs will appear here...'}
                </p>
              </div>
            </div>
            <button
              onClick={handleExecuteClick}
              className="execute-button"
              disabled={runStatusLoading}
              style={{ position: 'relative' }}
            >
              {runStatusLoading ? `Executing... ${executeProgress}%` : 'Execute'}
            </button>
            {runStatusLoading && (
              <ProgressBar progress={executeProgress} />
            )}
          </>
        )}

        {step === 'process' && !runStatusLoading && (
          <>
            {parsedData.length > 0 && <ParsedPreview data={parsedData} />}

            {parsedData.length > 0 && (
              <div className="text-center mt-8 download_btn">
                <button
                  onClick={handleDownload}
                  className="download-button"
                >
                  <DownloadIcon style={{ marginRight: '0.5rem' }} />
                  Download Processed Data
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
