import sys
import os

project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

from data_collector.app import create_app
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

if __name__ == "__main__":
    try:
        flask_env = os.getenv("FLASK_ENV")
        print(f"FLASK_ENV: {flask_env}")
    except Exception as e:
        logging.info(f"Error retrieving FLASK_ENV: {e}")
    
    app = create_app()
    app.logger.setLevel(logging.INFO)
    app.logger.info("Starting HVAC System Manager...")
    app.run(debug=True, host='0.0.0.0', port=5000)
