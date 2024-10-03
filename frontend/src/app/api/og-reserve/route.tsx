import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const hasTitle = searchParams.has("title");
    const hasDescription = searchParams.has("description");

    // Font
    const fontDataRomaben = await fetch(
      new URL("../../../../public/fonts/Romaben-Regular.ttf", import.meta.url)
    ).then((res) => res.arrayBuffer());

    const fontDataHelvetica = await fetch(
      new URL("../../../../public/fonts/Helvetica.ttf", import.meta.url)
    ).then((res) => res.arrayBuffer());

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            marginLeft: "auto",
            marginRight: "auto",
            padding: "1.5rem",
            backgroundImage: "linear-gradient(to bottom, #0267FF, #FFF)",
            borderRadius: "1.5rem",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            fontFamily: "Helvetica",
          }}
        >
          <div
            style={{
              display: "flex",
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "0.5rem 1rem",
              justifyContent: "center",
              marginBottom: "1.5rem",
              width: "auto",
              alignSelf: "center",
              boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
              border: "2px solid black",
            }}
          >
            <span
              style={{
                color: "black",
                fontSize: "2rem",
                fontWeight: "700",
                fontFamily: "Romaben",
              }}
            >
              Balances en tiempo real
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              height: "100%",
              gap: "1.5rem",
            }}
          >
            <div
              style={{
                flex: "1",
                borderRadius: "1.5rem",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  color: "black",
                }}
              >
                <h2
                  style={{
                    fontSize: "64px",
                    fontWeight: "700",
                    marginBottom: "0.5rem",
                    fontFamily: "Romaben",
                  }}
                >
                  Banco
                </h2>
                <p
                  style={{
                    fontSize: "64px",
                    fontWeight: "700",
                    marginBottom: "1rem",
                  }}
                >
                  $10,000
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "black",
                }}
              >
                <span style={{ fontSize: "2rem" }}>Total de Pesos en el Banco</span>
              </div>
            </div>

            {/* Divider vertical line dash */}
            <div
              style={{
                width: "0px",
                height: "100%",
                position: "relative",
                top: "0",
                borderLeft: "7px dashed white",
                borderRadius: "9999px",
              }}
            />

            <div
              style={{
                flex: "1",
                borderRadius: "1.5rem",
                alignItems: "flex-end",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  color: "black",
                  alignItems: "flex-end",
                }}
              >
                <h2
                  style={{
                    fontSize: "64px",
                    fontWeight: "700",
                    marginBottom: "0.5rem",
                    marginRight: "-0.5rem",
                    fontFamily: "Romaben",
                  }}
                >
                  Tokens
                </h2>
                <p
                  style={{
                    fontSize: "64px",
                    fontWeight: "700",
                    marginBottom: "1rem",
                  }}
                >
                  $10,000
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "black",
                }}
              >
                <span style={{ fontSize: "2rem" }}>Total de Pesos en el Banco</span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,

        fonts: [
          {
            name: "Romaben",
            data: fontDataRomaben,
            style: "normal",
            weight: 500,
          },
          {
            name: "Helvetica",
            data: fontDataHelvetica,
            style: "normal",
            weight: 400,
          },
        ],
      }
    );
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
