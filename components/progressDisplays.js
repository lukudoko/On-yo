import { PieChart, Pie, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { HiBookOpen, HiFire, HiMiniBookOpen, HiMiniCheckCircle, HiMiniQuestionMarkCircle } from "react-icons/hi2";


export const CircularProgressChart = ({ mastered, learning, unlearned, goal, total }) => {
    const data = [
        { name: 'Mastered', value: mastered, fill: '#26A682' },
        { name: 'Learning', value: learning, fill: '#FE9D0B' },
        { name: 'Unlearned', value: unlearned, fill: '#EB4752' }
    ];

    const filteredData = data.filter(item => item.value > 0);
    const masteredPercent = total > 0 ? Math.round((mastered / total) * 100) : 0;

    return (
        <div className="relative h-[17rem] aspect-square">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={filteredData}
                        cx="50%"
                        cy="50%"
                        innerRadius="70%"
                        outerRadius="100%"
                        cornerRadius="10%"
                        paddingAngle={4}
                        dataKey="value"
                        startAngle={90}
                        endAngle={450}
                        animationDuration={500}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[3rem] font-black">{masteredPercent}%</span>
                <span className="text-[0.7rem] text-gray-800">of {goal} complete!</span>
            </div>
        </div>
    );
};

export const SegmentedProgressBar = ({
    mastered,
    learning,
    unlearned,
    totalKanji,
    showProgress = true,
    hasProgressData = true,
    showLabels = true,
    alwaysExpanded = false
}) => {
    const segments = [
        { value: mastered,  color: '#26A682' },
        { value: learning,  color: '#FE9D0B' },
        { value: unlearned, color: '#EB4752' }
    ];

    if (!showProgress) return null;

    if (!hasProgressData) {
        return <div className="w-full h-1 rounded-full bg-gray-200" />;
    }

    const barHeight = alwaysExpanded ? 'h-3' : 'h-1 group-hover:h-6';
    const labelVisibility = alwaysExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100';

    return (
        <div className="w-full">
            <div className={`overflow-hidden rounded-full transition-all duration-200 ${barHeight}`}>
                <div className="flex h-full w-full">
                    {segments.map(({ value, color }, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-center"
                            style={{ width: `${(value / totalKanji) * 100}%`, backgroundColor: color }}
                        >
                            {showLabels && value > 0 && (
                                <span className={`text-white text-xs font-bold transition-opacity duration-200 delay-100 ${labelVisibility}`}>
                                    {value}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const JLPTProgressChart = ({ trackSpecificStats }) => {
  const data = [5, 4, 3, 2, 1].map(level => {
    const levelData = trackSpecificStats[`n${level}`];
    if (!levelData) return null;
    return {
      name: `N${level}`,
      percentage: levelData.percentage,
      mastered: levelData.mastered,
      learning: levelData.learning,
      unlearned: levelData.unlearned,
      total: levelData.totalKanji
    };
  }).filter(Boolean);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
 <div className="bg-white p-2 shadow-md rounded-xl text-sm">
          <p className="font-bold text-center text-lg mb-1">{label}</p>
          <div className='grid grid-cols-2 gap-2'>
            <div className="flex bg-[#26A68210] rounded-xl justify-center gap-x-1 items-center p-2">
              <HiMiniCheckCircle className="fill-[#26A682]" />
              <span className="text-sm font-black text-[#26A682]">{d.mastered}</span>
            </div>
            <div className="flex bg-[#FE9D0B10] rounded-xl justify-center gap-x-1 items-center p-2">
              <HiMiniBookOpen className="fill-[#FE9D0B]" />
              <span className="text-sm font-black text-[#FE9D0B]">{d.learning}</span>
            </div>

            <div className="flex bg-[#EB475210] rounded-xl justify-center gap-x-1 items-center p-2">
              <HiMiniQuestionMarkCircle className="fill-[#EB4752]" />
              <span className="text-sm font-black text-[#EB4752]">{d.unlearned}</span>
            </div>
            <div className="flex bg-[#6A7FDB10] rounded-xl text-sm font-black text-[#6A7FDB] justify-center gap-x-1 items-center p-2">

              <span>{d.total}</span>
              字
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLeftTick = ({ x, y, payload }) => (
    <text x={x} y={y} dy={4} textAnchor="end" className="fill-gray-500 text-xs font-semibold" fontSize={12}>
      {payload.value}
    </text>
  );

  const CustomRightTick = ({ x, y, payload }) => {
    const entry = data.find(d => d.name === payload.value);
    return (
      <text x={x + 4} y={y} dy={4} textAnchor="start" fontSize={12} fontWeight={600} fill="#6A7FDB">
        {entry ? `${Math.round(entry.percentage)}%` : ''}
      </text>
    );
  };

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={30}
            axisLine={false}
            tickLine={false}
            tick={<CustomLeftTick />}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            type="category"
            dataKey="name"
            width={45}
            axisLine={false}
            tickLine={false}
            tick={<CustomRightTick />}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'transparent' }}
          />
          <Bar
            dataKey="percentage"
            fill="#6A7FDB"
            radius={[0, 10, 10, 0]}
            animationDuration={500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};