"""
Logging configuration for TechSync API.
Provides structured logging for debugging and monitoring.
"""

import logging
import sys
from datetime import datetime

# Configure logging format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the specified name."""
    return logging.getLogger(name)

# Create default logger
logger = get_logger("techsync")
