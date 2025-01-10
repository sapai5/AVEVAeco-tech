export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">About TerraMind</h1>
        <p className="mb-4">
          TerraMind is an advanced data analysis platform designed specifically for the mining industry. 
          Our platform combines accurate machine learning algorithms with intuitive visualization tools 
          to ensure optimization in mining operations and predict key metrics.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
        <p className="mb-4">
          We aim to revolutionize the mining industry by providing accurate, real-time predictions 
          and insights that enable better decision-making and improved operational efficiency within commercial mining operations.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">Technology</h2>
        <p>
          Our backend is powered by Python, enabling advanced processing with machine learning and AI techniques, including random forest regression and CNN-LSTM models. We also incorporated large language models (LLMs) for text generation, which was used to determine sustainability score weights. The use of machine learning coupled with neural networks and sequential learning allowed accuracy above 99%.
        </p>
        <p>
        ㅤ
        </p>
        <p>  
          On the frontend, we employ React.js to create a dynamic and responsive user experience, enhanced by the Shadcn/UI component library. For data visualization, we use Recharts, which provides interactive charts and graphs that bring our data to life. Real-time communication is seamlessly managed through WebSockets, ensuring smooth data flow between the server and the client interface.
        </p>
        <p>
        ㅤ
        </p>
        <p>  
          Our application is hosted using Next.js, offering an efficient and scalable infrastructure. This setup is deployed on AWS EC2 after being containerized with Docker, ensuring reliability and ease of maintenance.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">Sustainability</h2>
        <p>
          Sustainability is at the core of TerraMind's mission. We aim to empower mining operations with the insights needed to make environmentally responsible decisions.  Our platform's sustainability score, derived from advanced analysis and forecasting, provides a clear metric for evaluating the environmental impact of mining activities over time. We are committed to promoting sustainable practices within the mining industry through data-driven decision-making.
        </p>
      </div>
    </div>
  )
}

