import React, { useRef, useState, useEffect } from "react";
import { API, Storage } from "aws-amplify";
import { useParams, useHistory } from "react-router-dom";
import {
  FormGroup,
  FormControl,
  ControlLabel,
  Glyphicon,
  Row,
  Col,
  Grid,
} from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import { onError } from "../libs/errorLib";
import { s3Upload } from "../libs/awsLib";
import config from "../config";
import "./Notes.css";
import "../components/LoadData.css";

export default function Notes() {
  const file = useRef(null);
  const { id } = useParams();
  const history = useHistory();
  const [note, setNote] = useState(null);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    function loadNote() {
      return API.get("notes", `/notes/${id}`);
    }

    async function onLoad() {
      try {
        const note = await loadNote();
        const { content, attachment } = note;

        if (attachment) {
          note.attachmentURL = await Storage.vault.get(attachment);
        }

        setContent(content);
        setNote(note);
      } catch (e) {
        onError(e);
      }
    }

    onLoad();
  }, [id]);

  function validateForm() {
    return content.length > 0;
  }

  function formatFilename(str) {
    return str.replace(/^\w+-/, "");
  }

  function handleFileChange(event) {
    file.current = event.target.files[0];
  }

  function saveNote(note) {
    return API.put("notes", `/notes/${id}`, {
      body: note,
    });
  }

  async function handleSubmit(event) {
    let attachment;

    event.preventDefault();

    if (file.current && file.current.size > config.MAX_ATTACHMENT_SIZE) {
      alert(
        `Please pick a file smaller than ${
          config.MAX_ATTACHMENT_SIZE / 1000000
        } MB.`
      );
      return;
    }

    setIsLoading(true);

    try {
      if (file.current) {
        attachment = await s3Upload(file.current);
      }

      await saveNote({
        content,
        attachment: attachment || note.attachment,
      });
      history.push("/");
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  function deleteNote() {
    return API.del("notes", `/notes/${id}`);
  }

  async function handleDelete(event) {
    event.preventDefault();

    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteNote();
      history.push("/");
    } catch (e) {
      onError(e);
      setIsDeleting(false);
    }
  }

  return (
    <div className="Notes">
      <Grid>
        {note ? (
          <form onSubmit={handleSubmit}>
            <FormGroup controlId="content">
              <FormControl
                value={content}
                componentClass="textarea"
                onChange={(e) => setContent(e.target.value)}
              />
            </FormGroup>
            {note.attachment && (
              <FormGroup>
                <ControlLabel>Attachment</ControlLabel>
                <FormControl.Static>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={note.attachmentURL}
                  >
                    {formatFilename(note.attachment)}
                  </a>
                </FormControl.Static>
              </FormGroup>
            )}
            <FormGroup controlId="file">
              {!note.attachment && <ControlLabel>Attachment</ControlLabel>}
              <FormControl onChange={handleFileChange} type="file" />
            </FormGroup>
            <Row>
              <Col md={6} lg={6} className="center">
                <LoaderButton
                  block
                  type="submit"
                  bsSize="large"
                  className="save-button"
                  isLoading={isLoading}
                  disabled={!validateForm()}
                >
                  <Glyphicon glyph="save" className="icon" />
                  Save
                </LoaderButton>
              </Col>
              <Col md={6} lg={6} className="center">
                <LoaderButton
                  block
                  bsSize="large"
                  bsStyle="danger"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                >
                  <Glyphicon glyph="trash" className="icon" />
                  Delete
                </LoaderButton>
              </Col>
            </Row>
          </form>
        ) : (
          <Row>
            <Col className="center">
              <Glyphicon glyph="refresh" className="loading" />
            </Col>
          </Row>
        )}
      </Grid>
    </div>
  );
}
