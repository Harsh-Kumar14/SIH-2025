// Test script for location functionality
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081';

// Test data
const testUser = {
  name: "Test User",
  contact: "1234567890",
  age: 25,
  gender: "male",
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    address: "New York, NY",
    city: "New York",
    state: "NY",
    country: "USA"
  }
};

async function testLocationAPI() {
  try {
    console.log("🧪 Testing Location API functionality...\n");

    // 1. Create a user with location
    console.log("1. Creating user with location...");
    const createResponse = await axios.post(`${API_BASE_URL}/add-user`, testUser);
    console.log("✅ User created:", createResponse.data.user.name);
    console.log("📍 Location saved:", createResponse.data.user.location);
    
    const userId = createResponse.data.userId;

    // 2. Update user location
    console.log("\n2. Updating user location...");
    const newLocation = {
      latitude: 34.0522,
      longitude: -118.2437,
      address: "Los Angeles, CA",
      city: "Los Angeles",
      state: "CA",
      country: "USA"
    };
    
    const updateResponse = await axios.put(`${API_BASE_URL}/api/users/${userId}/location`, newLocation);
    console.log("✅ Location updated:", updateResponse.data.data.location);

    // 3. Get users near location
    console.log("\n3. Finding users near location...");
    const nearResponse = await axios.get(`${API_BASE_URL}/api/users/near-location`, {
      params: {
        latitude: 34.0522,
        longitude: -118.2437,
        radius: 50 // 50km radius
      }
    });
    console.log("✅ Found", nearResponse.data.count, "users within 50km");

    // 4. Get user details
    console.log("\n4. Getting user details...");
    const userResponse = await axios.get(`${API_BASE_URL}/api/users/${userId}`);
    console.log("✅ User retrieved:", userResponse.data.data.name);
    console.log("📍 Current location:", userResponse.data.data.location);

    console.log("\n🎉 All tests passed! Location functionality is working correctly.");
    
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

// Run the test
testLocationAPI();
