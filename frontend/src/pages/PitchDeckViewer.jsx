import { Rnd } from "react-rnd";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./styles/PitchDeckViewer.css";
import "./styles/webstyle.css"
import { nanoid } from "nanoid";
import { FiX, FiTrash2, FiChevronRight, FiChevronLeft } from "react-icons/fi";

const PitchDeckViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dragtextbox, setdragTextbox] = useState({});
  const [showNotes, setShowNotes] = useState(false);
  const [selectedTextboxId, setSelectedTextboxId] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState("default");
  const canvasRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [slideImages, setSlideImages] = useState({});

  const themes = {
    default: {
      name: "Default",
      background: "#ffffff",
      textColor: "#000000",
      borderColor: "#cccccc",
    },
    dark: {
      name: "Dark Mode",
      background: "#1e1e1e",
      textColor: "#ffffff",
      borderColor: "#444",
    },
    ocean: {
      name: "Ocean Blue",
      background: "#e0f7fa",
      textColor: "#01579b",
      borderColor: "#4dd0e1",
    },
    sunset: {
      name: "Sunset",
      background: "#ffe0b2",
      textColor: "#bf360c",
      borderColor: "#ff7043",
    },
    forest: {
      name: "Forest",
      background: "#e8f5e9",
      textColor: "#1b5e20",
      borderColor: "#81c784",
    },
  };

  const handleAddImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newImage = {
        id: nanoid(),
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        src: reader.result,
      };
      const key = `slide-${currentSlide}`;
      setSlideImages((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), newImage],
      }));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        canvasRef.current &&
        !canvasRef.current.contains(event.target)
      ) {
        setSelectedTextboxId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!deck) return;
    const saveData = {
      deckId: id,
      theme: selectedTheme,
      textboxes: dragtextbox,
      images: slideImages,
      currentSlide,
    };
    localStorage.setItem(`pitch-deck-${id}`, JSON.stringify(saveData));
  }, [selectedTheme, dragtextbox, currentSlide]);

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:3000/api/pitch-decks/${id}`)
      .then((res) => {
        const savedData = localStorage.getItem(`pitch-deck-${id}`);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setSelectedTheme(parsed.theme || "default");
          setdragTextbox(parsed.textboxes || {});
          setSlideImages(parsed.images || {});
          setCurrentSlide(parsed.currentSlide || 0);
        }
        setDeck(res.data);
      })
      .catch(() => {
        alert("Pitch deck not found.");
        navigate("/decks");
      });
  }, [id, navigate]);

  useEffect(() => {
    if (!deck) return;

    const currentSlideKey = `slide-${currentSlide}`;

    if (!dragtextbox[currentSlideKey]) {
      const contentBox = allSlides[currentSlide]?.content
        ? [{
          id: nanoid(),
          x: 100,
          y: 100,
          text: allSlides[currentSlide].content,
          width: 300,
          height: 100,
        }]
        : [];

      const titleBox = allSlides[currentSlide]?.title
        ? [{
          id: nanoid(),
          x: 50,
          y: 30,
          text: allSlides[currentSlide].title,
          width: 300,
          height: 60,
        }]
        : [];

      const newBoxes = [...titleBox, ...contentBox];

      setdragTextbox(prev => ({
        ...prev,
        [currentSlideKey]: newBoxes
      }));
    }
  }, [deck, currentSlide]);


  if (!deck) return null;

  const { pitchTitle, slides = [] } = deck;
  const allSlides = [{ title: pitchTitle, content: "", presenterNotes: "" }, ...slides];
  const slide = allSlides[currentSlide];

  const handleSave = () => {
    setIsSaving(true);

    const saveData = {
      deckId: id,
      theme: selectedTheme,
      textboxes: dragtextbox,
      images: slideImages,
      currentSlide,
    };

    localStorage.setItem(`pitch-deck-${id}`, JSON.stringify(saveData));

    setTimeout(() => {
      setIsSaving(false);
      alert("Your changes has been saved.");
    }, 500);
  };

  return (
    <div className="results-container">
      <div className='deckNav'>
        <FiX 
          style={{
            color:'#FF047D',
            fontSize: 34,
          }}
          onClick={() => navigate("/main")}
        />
        <h3>Edit Pitch</h3>
        <FiTrash2
          style={{
            color:'#FF047D',
            fontSize: 34,
            position: 'absolute',
            alignSelf:'center',
            right: 40,
            top: 25,
          }}
          onClick={() => navigate("/main")} //change to deleting pitch
        />
      </div>
      <div className='editDeckContainer'>
        <div className="theme-panel">
          <h3>Themes</h3>
          {Object.entries(themes).map(([key, theme]) => (
            <button
              key={key}
              className={`theme-btn ${selectedTheme === key ? "active" : ""}`}
              onClick={() => setSelectedTheme(key)}
            >
              {theme.name}
            </button>
          ))}
            <div className="editbtnContainer">
                <input
                type="file"
                accept="image/*"
                id="image-upload"
                style={{ display: "none" }}
                onChange={(e) => handleAddImage(e)}
              />
              <button
                style={{
                  color: "black",
                  backgroundColor: " #6fffe9",
                  borderColor:' #6fffe9',
                  height: 40,
                  width: 180,
                  borderRadius: 25,
                  fontSize: 18,
                }}
                className="add-image-btn"
                onClick={() => document.getElementById("image-upload").click()}
              >
                 Add Image
              </button>
              <button
                className="add-text-btn"
                onClick={() => {
                  const newBox = {
                    id: nanoid(),
                    x: 50,
                    y: 50,
                    text: "New Text",
                    width: 200,
                    height: 60,
                  };
                  const key = `slide-${currentSlide}`;
                  setdragTextbox((prev) => ({
                    ...prev,
                    [key]: [...(prev[key] || []), newBox],
                  }));
                }}
                style={{
                    color: "black",
                    backgroundColor: " #6fffe9",
                    height: 40,
                    width: 180,
                    borderRadius: 25,
                    fontSize: 18,
                    marginBottom: 10,
                }}
              >
                Add Text Box
              </button>

              <button
                style={{
                  color: "black",
                  backgroundColor: " #6fffe9",
                  borderColor:' #6fffe9',
                  height: 40,
                  width: 180,
                  borderRadius: 25,
                  fontSize: 18,
                  marginBottom: 10,
                }}
                onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "💾 Save"}
              </button>

              {slide.presenterNotes && (
                <button
                  style={{
                  color: "aliceblue",
                  backgroundColor: "#FF047D",
                  height: 40,
                  width: 200,
                  padding: 10,
                  borderRadius: 25,
                  fontSize: 15,
                  marginLeft:-10,
                  }}
                  className="toggle-notes-btn"
                  onClick={() => setShowNotes((prev) => !prev)}
                >
                  {showNotes ? "Hide" : "Show"} Presenter Notes
                </button>
              )}
            </div>
            <div className="navigation">
            <button className='slideBtn' onClick={() => setCurrentSlide((p) => Math.max(p - 1, 0))} disabled={currentSlide === 0}>
              <FiChevronLeft/>
            </button>
            <span>
              Slide {currentSlide + 1} of {allSlides.length}
            </span>
            <button className='slideBtn' onClick={() => setCurrentSlide((p) => Math.min(p + 1, allSlides.length - 1))} disabled={currentSlide === allSlides.length - 1}>
              <FiChevronRight/>
            </button>
         </div>
          </div>
          <div ref={canvasRef} className="slide-canvas" style={{
            backgroundColor: themes[selectedTheme].background,
            color: themes[selectedTheme].textColor,
            borderColor: themes[selectedTheme].borderColor,
            marginTop: 40,
            marginLeft:60,
          }}>
            {dragtextbox[`slide-${currentSlide}`]?.map((box) => (
              <Rnd
                key={box.id}
                default={{
                  x: box.x,
                  y: box.y,
                  width: box.width,
                  height: box.height,
                }}
                bounds="parent"
                className={`rnd-textbox ${selectedTextboxId === box.id ? "selected" : ""}`}
                onClick={() => setSelectedTextboxId(box.id)}
                onDragStop={(e, d) => {
                  setSelectedTextboxId(box.id);
                  setdragTextbox((prev) => {
                    const updated = prev[`slide-${currentSlide}`].map((b) =>
                      b.id === box.id ? { ...b, x: d.x, y: d.y } : b
                    );
                    return { ...prev, [`slide-${currentSlide}`]: updated };
                  });
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  setSelectedTextboxId(box.id);
                  setdragTextbox((prev) => {
                    const updated = prev[`slide-${currentSlide}`].map((b) =>
                      b.id === box.id
                        ? {
                          ...b,
                          width: ref.offsetWidth,
                          height: ref.offsetHeight,
                          ...position,
                        }
                        : b
                    );
                    return { ...prev, [`slide-${currentSlide}`]: updated };
                  });
                }}
              >
                {selectedTextboxId === box.id && (
                  <button
                    className="delete-btn"
                    onClick={() => {
                      setdragTextbox((prev) => {
                        const updated = prev[`slide-${currentSlide}`].filter((b) => b.id !== box.id);
                        return { ...prev, [`slide-${currentSlide}`]: updated };
                      });
                      setSelectedTextboxId(null);
                    }}
                  >
                    ❌
                  </button>
                )}
                <textarea
                  className="rnd-textarea"
                  value={box.text}
                  style={{ color: themes[selectedTheme].textColor }}
                  onClick={() => setSelectedTextboxId(box.id)}
                  onChange={(e) => {
                    setdragTextbox((prev) => {
                      const updated = prev[`slide-${currentSlide}`].map((b) =>
                        b.id === box.id ? { ...b, text: e.target.value } : b
                      );
                      return { ...prev, [`slide-${currentSlide}`]: updated };
                    });
                  }}
                />
              </Rnd>
            ))}

            {slideImages[`slide-${currentSlide}`]?.map((img) => (
              <Rnd
              key={img.id}
              default={{ x: img.x, y: img.y, width: img.width, height: img.height }}
              bounds="parent"
              className={`rnd-image ${selectedTextboxId === img.id ? "selected" : ""}`}
              onClick={() => setSelectedTextboxId(img.id)}
              onDragStop={(e, d) => {
                setSelectedTextboxId(img.id);
                setSlideImages((prev) => {
                  const updated = prev[`slide-${currentSlide}`].map((i) =>
                    i.id === img.id ? { ...i, x: d.x, y: d.y } : i
                  );
                  return { ...prev, [`slide-${currentSlide}`]: updated };
                });
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                setSelectedTextboxId(img.id);
                setSlideImages((prev) => {
                  const updated = prev[`slide-${currentSlide}`].map((i) =>
                    i.id === img.id
                      ? {
                          ...i,
                          width: ref.offsetWidth,
                          height: ref.offsetHeight,
                          ...position,
                        }
                      : i
                  );
                  return { ...prev, [`slide-${currentSlide}`]: updated };
                });
              }}
            >
              {selectedTextboxId === img.id && (
                <button
                  className="delete-btn"
                  onClick={() => {
                    setSlideImages((prev) => {
                      const updated = prev[`slide-${currentSlide}`].filter((i) => i.id !== img.id);
                      return { ...prev, [`slide-${currentSlide}`]: updated };
                    });
                    setSelectedTextboxId(null);
                  }}
                >
                  ❌
                </button>
              )}
              <img
                src={img.src}
                alt="slide img"
                style={{ width: "100%", height: "100%", pointerEvents: "none", userSelect: "none" }}
                draggable={false}
              />
            </Rnd>
            ))}
          </div>
          <div className="navigation">
            {showNotes && slide.presenterNotes && (
            <div style={{width:1000, marginLeft:130, textAlign:'center'}} className="presenter-notes">
              <strong>Presenter Notes:</strong> {slide.presenterNotes}
            </div>
          )}
          </div>
      </div>

    </div>
  );
};

export default PitchDeckViewer;
