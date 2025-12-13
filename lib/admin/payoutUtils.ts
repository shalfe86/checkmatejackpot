import { PayoutScheduleItem, PayoutType } from "../../types";

export const calculatePayoutSchedule = (
  winnerId: string,
  totalAmount: number,
  payoutType: PayoutType
): PayoutScheduleItem[] => {
  const schedule: PayoutScheduleItem[] = [];
  const today = new Date();

  // Helper to add months to a date
  const addMonths = (date: Date, months: number) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d.toISOString();
  };

  // Helper to add years
  const addYears = (date: Date, years: number) => {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d.toISOString();
  };

  // 1. Under $20,000 OR Lump Sum Preference for small/medium amounts
  // Note: For tiers where "Cash Value" is a % (e.g. 65%), the totalAmount passed in 
  // should already be the reduced amount if the user chose Cash Option.
  if (totalAmount < 20000) {
    return [{
      winner_id: winnerId,
      due_date: new Date(today.setDate(today.getDate() + 15)).toISOString(), // 15 business days roughly
      amount: totalAmount,
      status: 'pending',
      installment_number: 1,
      total_installments: 1
    }];
  }

  // 2. $20k - $50k (1-year quarterly)
  if (totalAmount < 50000) {
    if (payoutType === 'lump_sum') {
       // Logic assumes totalAmount is already adjusted (e.g. 65%) or we treat it as immediate
       // For this util, we assume totalAmount is the FINAL payable amount.
       return [{
         winner_id: winnerId,
         due_date: addMonths(today, 1),
         amount: totalAmount,
         status: 'pending',
         installment_number: 1,
         total_installments: 1
       }];
    } else {
        // 4 Quarterly payments
        const installment = totalAmount / 4;
        for(let i=1; i<=4; i++) {
            schedule.push({
                winner_id: winnerId,
                due_date: addMonths(today, i * 3),
                amount: installment,
                status: 'pending',
                installment_number: i,
                total_installments: 4
            });
        }
        return schedule;
    }
  }

  // 3. $50k - $100k (2-year quarterly)
  if (totalAmount < 100000) {
     if (payoutType === 'lump_sum') return createSingle(winnerId, totalAmount);
     const installment = totalAmount / 8;
     for(let i=1; i<=8; i++) {
        schedule.push({
            winner_id: winnerId,
            due_date: addMonths(today, i * 3),
            amount: installment,
            status: 'pending',
            installment_number: i,
            total_installments: 8
        });
    }
    return schedule;
  }

  // 4. $100k - $1M (5-year annual)
  if (totalAmount < 1000000) {
     if (payoutType === 'lump_sum') return createSingle(winnerId, totalAmount);
     const installment = totalAmount / 5;
     for(let i=1; i<=5; i++) {
        schedule.push({
            winner_id: winnerId,
            due_date: addYears(today, i),
            amount: installment,
            status: 'pending',
            installment_number: i,
            total_installments: 5
        });
    }
    return schedule;
  }

  // 5. $1M - $10M (10-year annual)
  if (totalAmount < 10000000) {
    if (payoutType === 'lump_sum') return createSingle(winnerId, totalAmount);
    return createAnnualSchedule(winnerId, totalAmount, 10);
  }

  // 6. $10M - $50M (20-year annual)
  if (totalAmount < 50000000) {
    if (payoutType === 'lump_sum') return createSingle(winnerId, totalAmount);
    return createAnnualSchedule(winnerId, totalAmount, 20);
  }

  // 7. $50M+ (30-year annual)
  if (payoutType === 'lump_sum') return createSingle(winnerId, totalAmount);
  return createAnnualSchedule(winnerId, totalAmount, 30);
};

const createSingle = (id: string, amount: number): PayoutScheduleItem[] => {
    return [{
         winner_id: id,
         due_date: new Date().toISOString(),
         amount: amount,
         status: 'pending',
         installment_number: 1,
         total_installments: 1
    }];
};

const createAnnualSchedule = (id: string, amount: number, years: number): PayoutScheduleItem[] => {
    const schedule: PayoutScheduleItem[] = [];
    const installment = amount / years;
    const today = new Date();
    for(let i=1; i<=years; i++) {
        const d = new Date(today);
        d.setFullYear(d.getFullYear() + i);
        schedule.push({
            winner_id: id,
            due_date: d.toISOString(),
            amount: installment,
            status: 'pending',
            installment_number: i,
            total_installments: years
        });
    }
    return schedule;
};

// Calculates cash value based on tier
export const getCashValueRatio = (amount: number): number => {
    if (amount < 20000) return 1;
    if (amount < 100000) return 0.65;
    if (amount < 1000000) return 0.65;
    if (amount < 10000000) return 0.60;
    if (amount < 50000000) return 0.55;
    return 0.50;
}
