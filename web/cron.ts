import cron from 'node-cron';
import axios from 'axios';
import { StatusAPICode } from './src/_Common/enum/status-api-code.enum';
import { encrypt } from './src/_Common/function/Hashing';

const triggerCreditCron = async () => {
  try {
    const baseURL = process.env.API_BASE_URL || 'http://localhost:3000';
    const nowKL = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' });

    console.log(`[${nowKL}] Running subsidy trigger cronjob...`);

    const response = await axios.post(`${baseURL}/api/subsidy`, {
      [StatusAPICode.code]: StatusAPICode.CREATE_TRIGGER_SUBSIDY_CREDIT_CRON,
      key: encrypt('TRIGGER_CREDIT'),
    });

    console.log(`[${nowKL}] Trigger Result:`, response.data);
  } catch (error: any) {
    console.error('Error in triggerCreditCron:', error?.response?.data || error.message);
  }
};

// Scheduled every day at 05:50 AM Asia/Kuala_Lumpur time
cron.schedule('50 05 * * *', triggerCreditCron, {
  scheduled: true,
  timezone: 'Asia/Kuala_Lumpur',
});

console.log('Cron job scheduled (Timezone: Asia/Kuala_Lumpur)');
