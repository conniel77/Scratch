import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import { Link } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import {
  PageHeader,
  ListGroup,
  ListGroupItem,
  Glyphicon,
  FormGroup,
  FormControl,
  InputGroup,
  Button,
  Row,
  Col,
  Grid,
} from "react-bootstrap";
import { useAppContext } from "../libs/contextLib";
import { onError } from "../libs/errorLib";
import "./Home.css";
import "../components/LoadData.css";
import Typist from "react-typist";
import "../components/Typist.css";

export default function Home() {
  const [notes, setNotes] = useState([]);
  const { isAuthenticated } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filteredNotes, setFilteredNotes] = useState([]);

  useEffect(() => {
    async function onLoad() {
      if (!isAuthenticated) {
        return;
      }

      try {
        const notes = await loadNotes();
        setNotes(notes);
        sortNotes(notes);
        setFilteredNotes(notes);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, [isAuthenticated]);

  // Filter array based on search
  useEffect(() => {
    let searchResults;
    if (search) {
      searchResults = notes.filter((item) =>
        item.content.toLowerCase().includes(search.toLowerCase())
      );
    } else {
      searchResults = notes;
    }

    setFilteredNotes(searchResults);
  }, [search]);

  function loadNotes() {
    return API.get("notes", "/notes");
  }

  function handleSearch(e) {
    setSearch(e.target.value);
  }

  // Sort notes by latest date
  function sortNotes(notes) {
    notes.sort((a, b) => {
      return b.createdAt - a.createdAt;
    });
  }

  // Highlight searched string using Regex
  function highlightAll(text, search) {
    const parts = text.split(new RegExp(`(${search})`, "gi"));
    return (
      <span>
        {parts.map((part, i) => (
          <span
            key={i}
            style={
              part.toLowerCase() === search.toLowerCase()
                ? { color: "#2e9f9c" }
                : {}
            }
          >
            {part}
          </span>
        ))}
      </span>
    );
  }

  // Highlight the first searched string and return a substring
  function highlightSubstring(text, search) {
    if (search === "") {
      return <span className="space">{text}</span>;
    }
    let highlightBegin = text.toLowerCase().indexOf(search.toLowerCase());
    if (highlightBegin !== -1) {
      let lineBegin = highlightBegin >= 3 ? highlightBegin - 3 : 0;
      return (
        <span className="space">
          {highlightAll(text.substring(lineBegin, text.length), search)}
        </span>
      );
    } else {
      return <span>{text}</span>;
    }
  }

  // Render and display notes
  // Header displays first line of text
  // Content display Date Created and substring of second line of text
  function renderNotesList(notes, search) {
    return notes.map((note) => (
      <LinkContainer key={note.noteId} to={`/notes/${note.noteId}`}>
        <ListGroupItem
          header={
            <h4>{highlightAll(note.content.trim().split("\n")[0], search)}</h4>
          }
        >
          {new Date(note.createdAt).toLocaleString()}
          <span className="space">
            {note.content.trim().split("\n")[1]
              ? highlightSubstring(
                  note.content.substring(note.content.indexOf("\n")),
                  search
                )
              : " "}
          </span>
        </ListGroupItem>
      </LinkContainer>
    ));
  }

  // Typist animated feature for title
  function renderLander() {
    return (
      <div className="lander">
        <h1 className="lander-title">
          <Typist startDelay={1000}> Scratch</Typist>
        </h1>
        <p className="lander-subtitle">A simple note taking app</p>
        <div>
          <Link to="/login" className="btn btn-info btn-lg">
            Login
          </Link>
          <Link to="/signup" className="btn btn-teal btn-lg">
            Signup
          </Link>
        </div>
      </div>
    );
  }

  // Displays home page
  // If no notes are found, display not found message
  // Created a centered loading icon when loading notes
  function renderNotes() {
    return (
      <div className="notes">
        <Grid>
          <PageHeader>Your Notes</PageHeader>
          <Row>
            <Col sm={6} md={6}>
              <FormGroup className="vertical-center">
                <InputGroup>
                  <InputGroup.Addon className="search-icon">
                    <Glyphicon glyph="search" />
                  </InputGroup.Addon>
                  <FormControl
                    type="text"
                    value={search}
                    placeholder={"Search notes"}
                    onChange={handleSearch}
                  />
                </InputGroup>
              </FormGroup>
            </Col>
            <Col sm={6} md={6}>
              <div className="align-btn">
                <LinkContainer key="new" to="/notes/new">
                  <Button className="create-btn" bsSize="large">
                    <b>{"\uFF0B"}</b> Create a new note
                  </Button>
                </LinkContainer>
              </div>
            </Col>
          </Row>
          <ListGroup>
            {isLoading ? (
              <Row>
                <Col className="center">
                  <Glyphicon glyph="refresh" className="loading" />
                </Col>
              </Row>
            ) : filteredNotes.length === 0 ? (
              <h4>No notes are found</h4>
            ) : (
              renderNotesList(filteredNotes, search)
            )}
          </ListGroup>
        </Grid>
      </div>
    );
  }

  return (
    <div className="Home">
      {isAuthenticated ? renderNotes() : renderLander()}
    </div>
  );
}
