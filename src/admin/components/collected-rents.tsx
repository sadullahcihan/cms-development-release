import React, { useEffect, useState } from 'react';
import { PageContainer } from '@keystone-6/core/admin-ui/components';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { gql, useQuery } from '@keystone-6/core/admin-ui/apollo';

interface Payment {
  date: string;
  currency: 'TRY' | 'EUR' | 'USD';
  amount: number;
}

interface ChartDataPoint {
  month: string;
  TRY: number;
  EUR: number;
  USD: number;
}

interface PaymentData {
  payments: Payment[];
}

// GraphQL query to fetch payment data
const GET_PAYMENTS = gql`
  query GetPayments {
    payments {
      amount
      currency
      date
    }
  }
`;

export default function CollectedRents() {
  const { data, loading, error } = useQuery<PaymentData>(GET_PAYMENTS);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    if (data?.payments) {
      // Process payments data for the chart
      const paymentsByMonth: { [key: string]: ChartDataPoint } = {};
      
      data.payments.forEach((payment) => {
        const date = new Date(payment.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!paymentsByMonth[monthKey]) {
          paymentsByMonth[monthKey] = {
            month: monthKey,
            TRY: 0,
            EUR: 0,
            USD: 0,
          };
        }
        
        paymentsByMonth[monthKey][payment.currency] += payment.amount;
      });

      // Convert to array and sort by month
      const sortedData = Object.values(paymentsByMonth)
        .sort((a, b) => a.month.localeCompare(b.month));

      setChartData(sortedData);
    }
  }, [data]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;

  return (
    <PageContainer header="Collected Rents Dashboard">
      <div className="p-5">
        <div className="mb-5">
          <h2 className="text-2xl font-bold">Monthly Collected Rents</h2>
        </div>
        
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="TRY" name="Turkish Lira" fill="#8884d8" />
              <Bar dataKey="EUR" name="Euro" fill="#82ca9d" />
              <Bar dataKey="USD" name="US Dollar" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageContainer>
  );
}