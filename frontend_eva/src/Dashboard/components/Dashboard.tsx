import React from 'react';
import { Users, GraduationCap, Activity, TrendingUp, Calendar, Clock } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<any>;
  positive?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, positive = true }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-purple-700/30 hover:bg-white/20 transition-all duration-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-purple-300 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-white mt-2">{value}</p>
        <p className={`text-sm mt-2 ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {change} desde el mes pasado
        </p>
      </div>
      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const recentActivities = [
    { time: '10:30', description: 'Nueva sesión programada con María González', type: 'session' },
    { time: '09:15', description: 'Evaluación completada para Juan Pérez', type: 'evaluation' },
    { time: '08:45', description: 'Nuevo estudiante registrado: Carmen López', type: 'registration' },
    { time: '08:00', description: 'Reporte mensual generado', type: 'report' }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Terapeutas"
          value="24"
          change="+12%"
          icon={Users}
        />
        <StatCard
          title="Estudiantes Activos"
          value="156"
          change="+8%"
          icon={GraduationCap}
        />
        <StatCard
          title="Sesiones Hoy"
          value="32"
          change="+15%"
          icon={Activity}
        />
        <StatCard
          title="Progreso General"
          value="89%"
          change="+5%"
          icon={TrendingUp}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions Today */}
        <div className="lg:col-span-2 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-purple-700/30">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Sesiones de Hoy</h3>
            <Calendar className="w-5 h-5 text-purple-300" />
          </div>
          
          <div className="space-y-4">
            {[
              { time: '09:00', patient: 'Ana Martínez', therapist: 'Dr. Rodriguez', status: 'En curso' },
              { time: '10:30', patient: 'Carlos Ruiz', therapist: 'Dra. López', status: 'Programada' },
              { time: '14:00', patient: 'Elena García', therapist: 'Dr. Morales', status: 'Programada' },
              { time: '15:30', patient: 'Miguel Torres', therapist: 'Dra. Vega', status: 'Programada' }
            ].map((session, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-purple-800/30 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <div>
                    <p className="text-white font-medium">{session.patient}</p>
                    <p className="text-purple-300 text-sm">{session.therapist}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{session.time}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    session.status === 'En curso' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {session.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-purple-700/30">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Actividad Reciente</h3>
            <Clock className="w-5 h-5 text-purple-300" />
          </div>
          
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex space-x-3">
                <div className="w-8 h-8 bg-purple-600/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.description}</p>
                  <p className="text-purple-400 text-xs mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Chart Placeholder */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-purple-700/30">
        <h3 className="text-xl font-semibold text-white mb-6">Progreso Mensual</h3>
        <div className="h-64 bg-purple-800/20 rounded-lg flex items-center justify-center">
          <p className="text-purple-300">Gráfico de progreso aquí</p>
        </div>
      </div>
    </div>
  );
};