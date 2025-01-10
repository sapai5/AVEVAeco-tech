import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const PricingPage = () => {
  const pricingOptions = [
    {
      title: "Basic",
      price: "$?/month",
      description: "For small mining operations",
      features: ["Up to 5 users", "Basic data analysis", "Weekly reports"],
    },
    {
      title: "Professional",
      price: "$?/month",
      description: "For medium-sized mining companies",
      features: ["Up to 20 users", "Advanced data analysis", "Daily reports", "24/7 support"],
    },
    {
      title: "Enterprise",
      price: "Custom",
      description: "For large-scale mining operations",
      features: ["Unlimited users", "Real-time data analysis", "Custom reporting", "Dedicated support team", "On-site training"],
    },
  ]

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-12">Enhance Efficiency Today</h1>
      <div className="grid md:grid-cols-3 gap-8">
        {pricingOptions.map((option, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">{option.title}</CardTitle>
              <CardDescription>{option.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-3xl font-bold mb-4">{option.price}</p>
              <ul className="list-disc list-inside">
                {option.features.map((feature, featureIndex) => (
                  <li key={featureIndex}>{feature}</li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Choose Plan</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default PricingPage

