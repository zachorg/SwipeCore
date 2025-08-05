import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // TODO: Implement real restaurant details using usePlaceDetails hook
  // This page was previously showing mock data which was misleading to users
  // Should use usePlaceDetails(id) to fetch real Google Places API data

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Restaurant Details</h2>
        <p className="text-muted-foreground mb-4">
          This page is currently being refactored to use real restaurant data from the Google Places API.
        </p>
        <p className="text-sm text-muted-foreground mb-4">Restaurant ID: {id}</p>
        <Button onClick={() => navigate('/')}>Go back to restaurant list</Button>
      </div>
    </div>
  );
}