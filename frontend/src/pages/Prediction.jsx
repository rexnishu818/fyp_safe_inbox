
import { useState } from "react"
import "./Prediction.css"
import axios from "axios"

function SpamFilterPage() {
  const [emailContent, setEmailContent] = useState("")
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Function to call the Node.js server
  const checkForSpam = async () => {
    setLoading(true)
    try {
      const response = await axios.post("http://localhost:5001/classify-email", {
        message: emailContent,
      })
      setPrediction(response.data.prediction)
    } catch (err) {
      setError("Error detecting spam. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="spam-filter-container">
      <div className="spam-filter-card">
        <div className="header">
          <div className="logo">
            <span className="logo-icon">🛡️</span>
            <h1>SAFEINBOX</h1>
          </div>
          <p className="subtitle">Advanced Spam Email Detection</p>
        </div>

        <div className="content">
          <div className="instruction">
            <p>Paste your email content below to check if it's spam or not.</p>
          </div>

          <div className="email-input">
            <textarea
              rows="8"
              placeholder="Enter your email content here..."
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
            />
          </div>

          <div className="actions">
            <button
              className={`check-button ${loading ? "loading" : ""}`}
              onClick={checkForSpam}
              disabled={loading || !emailContent}
            >
              {loading ? (
                <span className="loading-text">
                  <span className="dot-animation">Analyzing</span>
                </span>
              ) : (
                "Check for Spam"
              )}
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}

          {!emailContent && !loading && !prediction && (
            <p className="warning">Please enter some email content before submitting.</p>
          )}

          {loading && (
            <div className="processing">
              <div className="processing-animation">
                <div className="scanner"></div>
              </div>
              <p>Processing email content...</p>
            </div>
          )}

          {prediction && !loading && (
            <div className={`result ${prediction.prediction === "Not Spam" ? "safe" : "danger"}`}>
              <div className="result-icon">{prediction.prediction === "Not Spam" ? "✅" : "🚫"}</div>
              <div className="result-content">
                <h2>{prediction.prediction === "Not Spam" ? "Email Appears Safe" : "Spam Detected"}</h2>
                <p className="confidence">
                  Confidence: <span className="confidence-value">{prediction.confidence}%</span>
                </p>
                <p className="recommendation">
                  {prediction.prediction === "Not Spam"
                    ? "This email appears to be legitimate and safe to open."
                    : "This email has been identified as potential spam. Exercise caution."}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="footer">
          <p>SAFEINBOX - Protecting your inbox from unwanted messages</p>
        </div>
      </div>
    </div>
  )
}

export default SpamFilterPage
