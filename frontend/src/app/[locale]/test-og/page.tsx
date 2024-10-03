const TestOg = () => {
  return (
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
          width: "fit-content",
          alignSelf: "center",
          boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
          border: "2px solid black",
        }}
      >
        <span style={{ color: "black", fontSize: "2rem", fontWeight: "700" }}>
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
                fontSize: "128px",
                fontWeight: "700",
                marginBottom: "0.5rem",
              }}
            >
              Banco
            </h2>
            <p
              style={{
                fontSize: "128px",
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
        <hr
          style={{
            width: "7px",
            height: "80vh",
            background: "repeating-linear-gradient(0deg,white 0 30px,#0000 0 40px)",
            border: "none",

            borderRadius: "9999px",
          }}
        />

        <div
          style={{
            flex: "1",
            borderRadius: "1.5rem",
            alignItems: "end",
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
                fontSize: "128px",
                fontWeight: "700",
                marginBottom: "0.5rem",
              }}
            >
              Tokens
            </h2>
            <p
              style={{
                fontSize: "128px",
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
  );
};

export default TestOg;
