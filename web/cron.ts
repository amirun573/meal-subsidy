import cron from 'node-cron';
import axios from 'axios';
import {StatusAPICode} from './src/_Common/enum/status-api-code.enum';
import {encrypt} from './src/_Common/function/Hashing';

const triggerCredit = async () => {
  try {
    console.log('Executing triggerCredit...');
    const baseURL = process.env.API_BASE_URL || 'http://localhost:3000'; // Use environment variable or default

    const response = await axios.post(`${baseURL}/api/subsidy`, {
      [StatusAPICode.code]: StatusAPICode.CREATE_TRIGGER_SUBSIDY_CREDIT_CRON,
      key: encrypt('TRIGGER_CREDIT'),
    });

    console.log('Successfully Triggered Credit:', response.data);

    const nowInMalaysia = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kuala_Lumpur',
    });
    console.log('Done at ===>', nowInMalaysia);

  } catch (error) {
    console.error('Error in triggerCredit:', error);
  }
};

cron.schedule('24 11 * * *', triggerCredit, {
  scheduled: true,
  timezone: 'Asia/Kuala_Lumpur',
});

// Schedule the cron job to run every 15 seconds (adjust for production use)
// cron.schedule("*/15 * * * * *", triggerCredit, {
//   scheduled: true,
//   timezone: "Asia/Kuala_Lumpur",
// });

console.log('Cron job scheduled');
