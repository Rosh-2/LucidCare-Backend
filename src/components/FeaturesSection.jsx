import { Laptop, Feather, Puzzle, Globe, HeartHandshake } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      title: "End-to-End Automation",
      description: "Automate intake forms, lab interpretations, and personalized treatment plans.",
      icon: <Laptop size={48} className="text-teal-500" />,
    },
    {
      title: "Multi-Modal AI",
      description: "Analyze diverse data sources from patient notes to lab results and lifestyle trackers.",
      icon: <Feather size={48} className="text-teal-500" />,
    },
    {
      title: "Explainable AI",
      description: "Get clear, understandable summaries with cited sources for every AI-generated recommendation.",
      icon: <Puzzle size={48} className="text-teal-500" />,
    },
    {
      title: "Multilingual Support",
      description: "Serve a global patient base with support for over 20 languages and cultural nuances.",
      icon: <Globe size={48} className="text-teal-500" />,
    },
    {
      title: "Patient Empowerment",
      description: "Provide patients with access to their data and summaries for better health literacy.",
      icon: <HeartHandshake size={48} className="text-teal-500" />,
    },
  ];

  // Split the features array into two parts
  const topFeatures = features.slice(0, 3);
  const bottomFeatures = features.slice(3);

  const FeatureCard = ({ feature, index }) => (
    <div
      key={index}
      className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center transition-transform transform hover:scale-105 duration-300 border border-gray-200"
    >
      <div className="bg-teal-100 rounded-full p-4 mb-6">{feature.icon}</div>
      <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
      <p className="text-gray-600">{feature.description}</p>
    </div>
  );

  return (
    <section id="features" className="py-20 px-4 sm:px-8 lg:px-16 bg-gray-50">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
          Why choose LucidCare?
        </h2>
        <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
          LucidCare makes medical insights simple, so everyone can take charge of their health.
        </p>

        {/* TOP 3 FEATURES: 3 columns on lg screens, remaining the same */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {topFeatures.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>

        {/* BOTTOM 2 FEATURES: Centered on larger screens */}
        <div className="flex justify-center">
          {/* Apply a max-width and use 2 columns for the bottom two features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            {bottomFeatures.map((feature, index) => (
              <FeatureCard key={index + 3} feature={feature} index={index + 3} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}