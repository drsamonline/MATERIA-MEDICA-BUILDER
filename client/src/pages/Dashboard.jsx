import { useState, useEffect } from 'react';
import { Card, Spinner } from '../components/ui';
import { statsAPI } from '../utils/api';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, Users, BookOpen, Activity } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await statsAPI.getStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          onClick={loadStats}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Retry
        </button>
      </Card>
    );
  }

  const statCards = [
    {
      title: 'Total Cases',
      value: stats?.totalCases || 0,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Success Rate',
      value: `${stats?.successRate || 0}%`,
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20'
    },
    {
      title: 'Total Remedies',
      value: stats?.totalRemedies || 0,
      icon: BookOpen,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Total Symptoms',
      value: stats?.totalSymptoms || 0,
      icon: Activity,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Overview of your clinical practice and remedy research
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outcome Distribution - Pie Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Treatment Outcomes
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.outcomeDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats?.outcomeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Remedies - Bar Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Most Used Remedies
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.topRemedies || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="usage_count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Cases Trend - Line Chart */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Cases Over Time (Last 6 Months)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats?.casesByMonth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#0d9488" 
                strokeWidth={2}
                dot={{ fill: '#0d9488', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Most Used Remedy Highlight */}
      {stats?.mostUsedRemedy && (
        <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                Most Prescribed Remedy
              </p>
              <p className="text-2xl font-bold text-primary-900 dark:text-primary-100 mt-1">
                {stats.mostUsedRemedy.name}
              </p>
              <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                Used in {stats.mostUsedRemedy.usage_count} cases
              </p>
            </div>
            <BookOpen className="w-12 h-12 text-primary-600 dark:text-primary-400 opacity-50" />
          </div>
        </Card>
      )}
    </div>
  );
}
