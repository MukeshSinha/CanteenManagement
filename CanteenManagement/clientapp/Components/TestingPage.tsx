import { useState, useEffect } from 'react';
const TestingPage = () => {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("api/test/GetData");   // relative URL ✔
                console.log("response is:", response);

                // agar server error aaye to
                if (!response.ok) {
                    throw new Error("Server error");
                }

                const result = await response.json();
                setData(result);

            } catch (error) {
                console.error("Error:", error);
            }
        };

        fetchData();
    }, []);

    if (!data) return <h2>Loading...</h2>;

    return (
        <div style={{ padding: 40 }}>
            <h1>{data.message}</h1>
            <p>Server Time: {data.serverTime}</p>
            <p>Version: {data.version}</p>
        </div>
    );
}
export default TestingPage;