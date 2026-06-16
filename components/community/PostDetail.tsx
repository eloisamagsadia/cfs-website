"use client";
import { useState, useRef, useEffect, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import ReactionBar from "./ReactionBar";
import { createClient } from "@/lib/supabase/client";

const PLATFORM_COLORS: Record<string, string> = { youtube: "#FF0000", tiktok: "#69C9D0", gdrive: "#4285F4", instagram: "#E1306C" };
const PLATFORM_LABELS: Record<string, string> = { youtube: "YouTube", tiktok: "TikTok", gdrive: "Google Drive", instagram: "Instagram" };
const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const QUICK_EMOJIS = ["❤️","🔥","😍","🥺","😂","👏","🎉","✨"];

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"});
}

function formatCount(n: number) {
  if (n >= 1000000) return (n/1000000).toFixed(1).replace(/\.0$/,"")+"M";
  if (n >= 1000) return (n/1000).toFixed(1).replace(/\.0$/,"")+"K";
  return String(n);
}

function renderContent(content: string) {
  const clean = content.replace(/<[^>]*>/g, "");
  return clean
    .replace(/@(\w+)/g,`<a href="#" onclick="event.preventDefault();fetch('/api/community/member-by-name?name=$1').then(r=>r.json()).then(d=>{if(d.userId)window.location.href='/members/community/members/'+d.userId})" style="color:#3CCE2A;font-weight:600;text-decoration:none;cursor:pointer;">@$1</a>`)
    .replace(/#(?![0-9A-Fa-f]{3,6}\b)(\w+)/g,`<span style="color:#F5C82A;font-weight:600;">#$1</span>`);
}

function Avatar({ profile, size=36, ring=false }: { profile:any; size?:number; ring?:boolean }) {
  const inner = (
    <div style={{ width:ring?size-4:size, height:ring?size-4:size, borderRadius:"50%", background:"#E8F0E4", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
      {profile?.avatar_url
        ? <img src={profile.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        : <span style={{ fontFamily:R, fontSize:(ring?size-4:size)*0.38, color:"#3CCE2A" }}>{(profile?.display_name??"M")[0].toUpperCase()}</span>
      }
    </div>
  );
  if (!ring) return <div style={{ width:size, height:size, borderRadius:"50%", flexShrink:0, overflow:"hidden", border:"2px solid #DDE8DD" }}>{inner}</div>;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:"linear-gradient(135deg,#3CCE2A,#F07228)", padding:"2px", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
      {inner}
    </div>
  );
}

const COMMENT_REACTIONS = [
  { emoji:"❤️", label:"Love" },
  { emoji:"👍", label:"Like" },
  { emoji:"😂", label:"Haha" },
  { emoji:"😮", label:"Wow" },
  { emoji:"🔥", label:"Fire" },
  { emoji:"🥺", label:"Sad" },
];

function CommentReactionBar({ commentId, myReaction, onChange }: { commentId:string; myReaction:string; onChange:(id:string,emoji:string)=>void }) {
  const [showPicker, setShowPicker] = useState(false);
  const [animating, setAnimating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowPicker(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handlePick(emoji: string) {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
    onChange(commentId, myReaction === emoji ? "" : emoji);
    setShowPicker(false);
  }

  return (
    <div ref={ref} style={{ position:"relative", display:"inline-block" }}>
      <button onClick={() => setShowPicker(p => !p)} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", alignItems:"center", gap:"3px" }}>
        {myReaction ? (
          <span style={{ fontSize:"16px", transition:"transform 0.2s", transform:animating?"scale(1.3)":"scale(1)" }}>{myReaction}</span>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
              stroke="#5A7A60" strokeWidth="1.8" fill="none"/>
          </svg>
        )}
      </button>
      {showPicker && (
        <div style={{ position:"absolute", bottom:"calc(100% + 6px)", left:0, background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"14px", padding:"6px 8px", display:"flex", gap:"4px", zIndex:30, boxShadow:"0 4px 20px rgba(0,0,0,0.5)", animation:"fadeUp 0.15s ease" }}>
          {COMMENT_REACTIONS.map(({emoji,label}) => (
            <button key={emoji} onClick={() => handlePick(emoji)} title={label}
              style={{ background:myReaction===emoji?"#E8F0E4":"none", border:myReaction===emoji?"1.5px solid #3CCE2A":"1.5px solid transparent", borderRadius:"8px", padding:"5px 7px", cursor:"pointer", fontSize:"18px", transition:"all 0.15s" }}
              onMouseEnter={e=>(e.currentTarget.style.transform="scale(1.2) translateY(-2px)")}
              onMouseLeave={e=>(e.currentTarget.style.transform="scale(1)")}>
              {emoji}
            </button>
          ))}
        </div>
      )}
      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

const ReplyInput = memo(function ReplyInput({ commentId, authorName, currentUser, onSubmit, onCancel }: {
  commentId: string; authorName: string; currentUser: any;
  onSubmit: (text: string, parentId: string) => void;
  onCancel: () => void;
}) {
  const cleanName = authorName.replace(/<[^>]*>/g, '').trim();
  const [text, setText] = useState(`@${cleanName} `);
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  async function handleSubmit() {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    const cleaned = text.replace(/<[^>]*>?/gm, '').replace(/style="[^"]*"/g, '').trim();
    await onSubmit(cleaned, commentId);
    setSubmitting(false);
  }

  return (
    <div style={{ marginLeft:"46px", marginTop:"8px", display:"flex", gap:"8px", alignItems:"flex-end" }}>
      <Avatar profile={currentUser} size={26}/>
      <div style={{ flex:1, background:"#F2F7F2", border:"1.5px solid #3CCE2A", borderRadius:"12px", padding:"8px 14px" }}>
        <textarea
          ref={ref}
          value={text}
          onChange={e => { setText(e.target.value); e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,80)+"px"; }}
          onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSubmit();} if(e.key==="Escape")onCancel(); }}
          rows={1}
          style={{ width:"100%", background:"transparent", border:"none", outline:"none", color:"#1B3A2D", fontFamily:B, fontSize:"13px", resize:"none", lineHeight:1.5, maxHeight:"80px", overflow:"auto" }}
        />
        {text.trim() && (
          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:"4px" }}>
            <button onClick={handleSubmit} disabled={submitting} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:R, fontSize:"11px", color:"#3CCE2A", letterSpacing:"1px", padding:0 }}>
              {submitting?"...":"SEND"}
            </button>
          </div>
        )}
      </div>
      <button onClick={onCancel} style={{ background:"none", border:"none", color:"#5A7A60", cursor:"pointer", fontSize:"16px", paddingBottom:"4px" }}>✕</button>
    </div>
  );
});

function CommentItem({ comment, level=0, currentUser, replies, commentReactions, onReactionChange, onReply, replyingToId, onSubmitReply, onCancelReply, onDelete }: any) {
  const cp = comment.profiles ?? {};
  const myReaction = commentReactions[comment.id] ?? "";
  const isOwner = comment.user_id === currentUser.id;
  const [showReplies, setShowReplies] = useState(false);

  return (
    <div style={{ marginLeft:level>0?"42px":0, marginBottom:"14px" }}>
      <div style={{ display:"flex", gap:"10px", alignItems:"flex-start" }}>
        <Avatar profile={cp} size={level>0?28:36}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ padding:"2px 0 6px" }}>
            <div style={{ fontFamily:R, fontSize:"12px", color:"#1B3A2D", letterSpacing:"0.5px", marginBottom:"4px" }}>{cp.display_name??"Member"}</div>
            <div style={{ fontFamily:B, fontSize:"13px", color:"#5A7A60", lineHeight:1.65, wordBreak:"break-word" }}
              dangerouslySetInnerHTML={{ __html: renderContent((comment.content||"").replace(/<[^>]*>/g,"")) }}/>
          </div>
          <div style={{ display:"flex", gap:"12px", alignItems:"center", paddingLeft:"4px" }}>
            <CommentReactionBar commentId={comment.id} myReaction={myReaction} onChange={onReactionChange}/>
            <span style={{ fontFamily:B, fontSize:"10px", color:"#3A5A30" }}>{timeAgo(comment.created_at)}</span>
            {level===0 && <button onClick={()=>onReply(comment.id===replyingToId?null:comment.id,cp.display_name??"Member")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:B, fontSize:"11px", color:comment.id===replyingToId?"#3CCE2A":"#5A7A60", padding:0 }}>
              {comment.id===replyingToId?"Cancel":"Reply"}
            </button>}
            {isOwner && <button onClick={()=>onDelete(comment.id)} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:B, fontSize:"11px", color:"#3A5A30", padding:0 }}>Delete</button>}
          </div>
          {replies?.length>0 && level===0 && (
            <button onClick={()=>setShowReplies(p=>!p)} style={{ display:"flex", alignItems:"center", gap:"6px", background:"none", border:"none", cursor:"pointer", fontFamily:B, fontSize:"11px", color:"#3CCE2A", padding:"6px 0 0 4px" }}>
              <div style={{ width:"24px", height:"1px", background:"#DDE8DD" }}/>
              {showReplies?"Hide replies":`View ${replies.length} repl${replies.length>1?"ies":"y"}`}
            </button>
          )}
        </div>
      </div>
      {showReplies && replies?.map((r:any) => (
        <CommentItem key={r.id} comment={r} level={1} currentUser={currentUser} replies={[]} commentReactions={commentReactions} onReactionChange={onReactionChange} onReply={onReply} replyingToId={replyingToId} onSubmitReply={onSubmitReply} onCancelReply={onCancelReply} onDelete={onDelete}/>
      ))}
      {comment.id===replyingToId && (
        <ReplyInput commentId={comment.id} authorName={cp.display_name??"Member"} currentUser={currentUser} onSubmit={onSubmitReply} onCancel={onCancelReply}/>
      )}
    </div>
  );
}

export default function PostDetail({ post, initialComments, currentUser }: { post:any; initialComments:any[]; currentUser:any }) {
  const supabase = createClient();
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [reactions, setReactions] = useState(post.community_reactions??[]);
  const [commentText, setCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string|null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [commentReactions, setCommentReactions] = useState<Record<string,string>>({});
  const [lightboxImg, setLightboxImg] = useState<string|null>(null);
  const [embedFailed, setEmbedFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [viewCount, setViewCount] = useState<number>(post.view_count??0);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const hasTrackedView = useRef(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{top:number,right:number}|null>(null);

  const profile = post.profiles??{};
  const isOwner = post.user_id === currentUser.id;
  const topComments = comments.filter(c=>!c.parent_comment_id);
  const getReplies = (id:string) => comments.filter(c=>c.parent_comment_id===id);
  const content = post.content??"";
  const isLong = content.length>300;
  const totalReactions = reactions.length;

  useEffect(()=>{
    const channel = supabase.channel(`post_${post.id}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"community_reactions",filter:`post_id=eq.${post.id}`},(p)=>{
        setReactions((prev:any[])=>{ if(prev.find(x=>x.id===p.new.id))return prev; return [...prev,p.new]; });
      })
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"community_reactions",filter:`post_id=eq.${post.id}`},(p)=>{
        setReactions((prev:any[])=>prev.map(x=>x.id===p.new.id?p.new:x));
      })
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"community_reactions",filter:`post_id=eq.${post.id}`},(p)=>{
        setReactions((prev:any[])=>prev.filter(x=>x.id!==p.old.id));
      })
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"community_comments",filter:`post_id=eq.${post.id}`},async(p)=>{
        if(p.new.user_id===currentUser.id)return;
        const{data}=await supabase.from("community_comments").select("*, profiles:user_id(id,display_name,avatar_url)").eq("id",p.new.id).single();
        if(data)setComments(prev=>{ if(prev.find(x=>x.id===data.id))return prev; return [...prev,data]; });
      })
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"community_comments",filter:`post_id=eq.${post.id}`},(p)=>{
        setComments(prev=>prev.filter(c=>c.id!==p.old.id));
      })
      .subscribe();
    return ()=>{ supabase.removeChannel(channel); };
  },[post.id]);

  useEffect(()=>{
    if(hasTrackedView.current)return;
    hasTrackedView.current=true;
    fetch(`/api/community/posts/${post.id}/view`,{method:"POST"})
      .then(r=>r.json()).then(d=>{ if(d.view_count!==undefined)setViewCount(d.view_count); }).catch(()=>{});
  },[]);

  async function handleDelete() {
    await fetch(`/api/community/posts?id=${post.id}`, { method: "DELETE" });
    router.push("/members/community");
  }

  async function handleCopyLink() {
    setShowMenu(false); setMenuPos(null);
    navigator.clipboard?.writeText(`${window.location.origin}/members/community/${post.id}`);
  }

  async function submitComment(text:string, parentId:string|null=null) {
    if(!text.trim())return;
    setSubmitting(true);
    const res = await fetch(`/api/community/posts/${post.id}/comments`,{
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({content:text.replace(/<[^>]*>/g,"").trim(),parent_comment_id:parentId}),
    });
    const{comment}=await res.json();
    if(comment){
      setComments(prev=>{ if(prev.find(x=>x.id===comment.id))return prev;
        const cleanComment = {...comment, content:(comment.content||'').replace(/<[^>]*>/g,'').trim()};
        return [...prev,{...cleanComment,profiles:{id:currentUser.id,display_name:currentUser.display_name,avatar_url:currentUser.avatar_url}}]; });
      if(!parentId){ setCommentText(""); setTimeout(()=>commentInputRef.current?.focus(),50); }
      else setReplyingToId(null);
    }
    setSubmitting(false);
  }

  async function deleteComment(commentId:string) {
    if(!confirm("Delete this comment?"))return;
    await fetch(`/api/community/posts/${post.id}/comments?commentId=${commentId}`,{method:"DELETE"});
    setComments(prev=>prev.filter(c=>c.id!==commentId));
  }

  function handleCommentReactionChange(commentId:string, emoji:string) {
    setCommentReactions(prev=>({...prev,[commentId]:emoji}));
  }

  function handleReply(commentId:string|null, _name:string) {
    setReplyingToId(commentId);
  }

  return (
    <div style={{ maxWidth:"680px", margin:"0 auto" }}>
      <Link href="/members/community" style={{ fontFamily:R, fontSize:"11px", color:"#5A7A60", textDecoration:"none", letterSpacing:"1px", display:"flex", alignItems:"center", gap:"6px", marginBottom:"16px" }}>
        <svg width="6" height="10" viewBox="0 0 6 10"><path d="M5 1L1 5L5 9" stroke="#5A7A60" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
        BACK TO FEED
      </Link>

      <div style={{ background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"16px", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"16px 18px" }}>
          <Avatar profile={profile} size={44} ring/>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:R, fontSize:"14px", color:"#1B3A2D", letterSpacing:"0.5px" }}>{profile.display_name??"Member"}</div>
            <div style={{ fontFamily:B, fontSize:"11px", color:"#5A7A60" }}>{timeAgo(post.created_at)}</div>
          </div>
          {post.is_pinned&&<span style={{ fontFamily:R, fontSize:"9px", color:"#F5C82A", background:"#3D3000", border:"1px solid #F5C82A40", borderRadius:"4px", padding:"2px 8px" }}>📌 PINNED</span>}

          {/* ── ··· MENU BUTTON ── */}
          <button
            ref={menuBtnRef}
            onClick={() => {
              if (showMenu) { setShowMenu(false); setMenuPos(null); return; }
              const rect = menuBtnRef.current!.getBoundingClientRect();
              setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
              setShowMenu(true);
            }}
            style={{ background:"none", border:"none", color:"#5A7A60", cursor:"pointer", fontSize:"20px", padding:"4px", lineHeight:1 }}
          >···</button>
        </div>

        {/* Content */}
        <div style={{ padding:"0 18px 14px" }}>
          <div style={{ fontFamily:B, fontSize:"15px", color:"#D8D0B8", lineHeight:1.8, whiteSpace:"pre-wrap", wordBreak:"break-word" }}
            dangerouslySetInnerHTML={{ __html:renderContent(expanded||!isLong?content:content.slice(0,300)+"...") }}/>
          {isLong&&<button onClick={()=>setExpanded(e=>!e)} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:B, fontSize:"12px", color:"#5A7A60", padding:"2px 0 0" }}>{expanded?"see less":"see more"}</button>}
        </div>

        {/* Images */}
        {post.video_embed_url && (
          <div style={{ marginBottom: "16px", borderRadius: "10px", overflow: "hidden", border: "1.5px solid #DDE8DD", position: "relative" }}>
            <div style={{ position: "absolute", top: "8px", left: "8px", zIndex: 2, background: PLATFORM_COLORS[post.video_platform] ?? "#5A7A60", borderRadius: "6px", padding: "2px 8px", fontFamily: B, fontSize: "10px", color: "#fff", fontWeight: 700 }}>
              {PLATFORM_LABELS[post.video_platform] ?? "Video"}
            </div>
            {(post.video_platform === "tiktok" || post.video_platform === "instagram") && embedFailed ? (
              <a href={post.video_url ?? post.video_embed_url} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px", background: "#F2F7F2", textDecoration: "none" }}>
                <span style={{ fontSize: "32px" }}>{post.video_platform === "tiktok" ? "🎵" : "📸"}</span>
                <div>
                  <p style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", margin: 0 }}>{post.video_platform === "tiktok" ? "TikTok" : "Instagram"} Video</p>
                  <p style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", margin: "2px 0 0" }}>Click to open on {post.video_platform === "tiktok" ? "TikTok" : "Instagram"}</p>
                </div>
              </a>
            ) : (
              <iframe
                src={post.video_embed_url}
                style={{ width: "100%", height: "360px", border: "none", display: "block" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={() => setEmbedFailed(true)}
              />
            )}
          </div>
        )}
        {post.images?.length>0&&(
          <div>
            {post.images.length===1
              ?<img src={post.images[0]} alt="" onClick={()=>setLightboxImg(post.images[0])} style={{ width:"100%", maxHeight:"480px", objectFit:"cover", display:"block", cursor:"zoom-in" }}/>
              :<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px" }}>
                {post.images.slice(0,4).map((img:string,i:number)=>(
                  <div key={i} style={{ position:"relative" }}>
                    <img src={img} alt="" onClick={()=>setLightboxImg(img)} style={{ width:"100%", height:"200px", objectFit:"cover", display:"block", cursor:"zoom-in" }}/>
                    {i===3&&post.images.length>4&&<div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontFamily:R, fontSize:"22px", color:"#fff" }}>+{post.images.length-4}</span></div>}
                  </div>
                ))}
              </div>
            }
          </div>
        )}

        {/* Reactions */}
        <div style={{ padding:"4px 18px 0" }}>
          <ReactionBar postId={post.id} reactions={reactions} currentUserId={currentUser.id} commentCount={comments.length} onCommentClick={()=>commentInputRef.current?.focus()}/>
        </div>

        {/* Analytics */}
        <div style={{ margin:"8px 18px", borderTop:"1px solid #DDE8DD", paddingTop:"10px" }}>
          <div style={{ display:"flex", gap:"16px", alignItems:"center", flexWrap:"wrap" }}>
            {viewCount>0&&<span style={{ fontFamily:B, fontSize:"12px", color:"#3A5A30", display:"flex", alignItems:"center", gap:"4px" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M1 12C1 12 5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="#3A5A30" strokeWidth="1.8" fill="none"/><circle cx="12" cy="12" r="3" stroke="#3A5A30" strokeWidth="1.8" fill="none"/></svg>
              {formatCount(viewCount)} views
            </span>}
            {totalReactions>0&&<span style={{ fontFamily:B, fontSize:"12px", color:"#3A5A30" }}>{formatCount(totalReactions)} likes</span>}
            {comments.length>0&&<span style={{ fontFamily:B, fontSize:"12px", color:"#3A5A30" }}>{formatCount(comments.length)} comments</span>}
            {viewCount>0&&totalReactions>0&&<span style={{ fontFamily:R, fontSize:"11px", color:"#3CCE2A", marginLeft:"auto" }}>{((totalReactions/viewCount)*100).toFixed(1)}% engagement</span>}
          </div>
          <div style={{ fontFamily:B, fontSize:"11px", color:"#3A5A30", marginTop:"6px" }}>
            {new Date(post.created_at).toLocaleDateString("en-PH",{month:"long",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"})}
          </div>
        </div>

        <div style={{ borderTop:"1px solid #DDE8DD", margin:"0 18px" }}/>

        {/* Comments */}
        <div style={{ padding:"14px 18px" }}>
          {topComments.length>0&&<div style={{ fontFamily:B, fontSize:"12px", color:"#5A7A60", marginBottom:"14px" }}>{comments.length} comment{comments.length!==1?"s":""}</div>}
          {topComments.length===0
            ?<div style={{ textAlign:"center", padding:"20px 0 10px", fontFamily:B, fontSize:"13px", color:"#3A5A30" }}>No comments yet — be the first! 💬</div>
            :topComments.map(c=>(
              <CommentItem
                key={c.id} comment={c} level={0} currentUser={currentUser}
                replies={getReplies(c.id)} commentReactions={commentReactions}
                onReactionChange={handleCommentReactionChange}
                onReply={handleReply} replyingToId={replyingToId}
                onSubmitReply={submitComment} onCancelReply={()=>setReplyingToId(null)}
                onDelete={deleteComment}
              />
            ))
          }
        </div>

        {/* Comment input */}
        <div style={{ borderTop:"1px solid #DDE8DD", padding:"12px 18px 16px", background:"#131E10" }}>
          <div style={{ display:"flex", gap:"6px", marginBottom:"10px" }}>
            {QUICK_EMOJIS.map(emoji=>(
              <button key={emoji} onClick={()=>{ setCommentText(p=>p+emoji); commentInputRef.current?.focus(); }}
                style={{ background:"#F2F7F2", border:"1.5px solid #DDE8DD", borderRadius:"8px", padding:"4px 7px", cursor:"pointer", fontSize:"16px", transition:"transform 0.1s" }}
                onMouseEnter={e=>(e.currentTarget.style.transform="scale(1.25)")}
                onMouseLeave={e=>(e.currentTarget.style.transform="scale(1)")}>
                {emoji}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:"10px", alignItems:"flex-end" }}>
            <Avatar profile={currentUser} size={34}/>
            <div style={{ flex:1, background:"#F2F7F2", border:"1.5px solid #DDE8DD", borderRadius:"20px", padding:"9px 16px", display:"flex", alignItems:"flex-end", gap:"8px" }}>
              <textarea ref={commentInputRef} value={commentText}
                onChange={e=>{ setCommentText(e.target.value); e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,100)+"px"; }}
                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submitComment(commentText);} }}
                placeholder="Add a comment..." rows={1}
                style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#1B3A2D", fontFamily:B, fontSize:"13px", resize:"none", lineHeight:1.5, maxHeight:"100px", overflow:"auto" }}/>
              {commentText.trim()&&<button onClick={()=>submitComment(commentText)} disabled={submitting} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:R, fontSize:"12px", color:"#3CCE2A", letterSpacing:"1px", padding:"0 0 1px", flexShrink:0, opacity:submitting?0.5:1 }}>POST</button>}
            </div>
          </div>
        </div>
      </div>

      {/* ── PORTALED ··· MENU ── */}
      {showMenu && menuPos && createPortal(
        <>
          <div onClick={() => { setShowMenu(false); setMenuPos(null); }} style={{ position:"fixed", inset:0, zIndex:998 }}/>
          <div style={{ position:"fixed", top:menuPos.top, right:menuPos.right, background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"12px", padding:"6px", zIndex:999, minWidth:"170px", boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
            <button onClick={handleCopyLink}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:"10px", padding:"9px 12px", borderRadius:"8px", background:"none", border:"none", cursor:"pointer", fontFamily:B, fontSize:"13px", color:"#1B3A2D", textAlign:"left" }}
              onMouseEnter={e=>(e.currentTarget.style.background="#F2F7F2")} onMouseLeave={e=>(e.currentTarget.style.background="none")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#1B3A2D" strokeWidth="2" strokeLinecap="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#1B3A2D" strokeWidth="2" strokeLinecap="round"/></svg>
              Copy link
            </button>
            {isOwner && <>
              <div style={{ borderTop:"1px solid #DDE8DD", margin:"4px 0" }}/>
              <button onClick={() => { setShowMenu(false); setMenuPos(null); setShowDeleteConfirm(true); }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:"10px", padding:"9px 12px", borderRadius:"8px", background:"none", border:"none", cursor:"pointer", fontFamily:B, fontSize:"13px", color:"#F04060", textAlign:"left" }}
                onMouseEnter={e=>(e.currentTarget.style.background="#3D0A14")} onMouseLeave={e=>(e.currentTarget.style.background="none")}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="#F04060" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6" stroke="#F04060" strokeWidth="2" strokeLinecap="round"/><path d="M10 11v6M14 11v6" stroke="#F04060" strokeWidth="2" strokeLinecap="round"/><path d="M9 6V4h6v2" stroke="#F04060" strokeWidth="2" strokeLinecap="round"/></svg>
                Delete post
              </button>
            </>}
          </div>
        </>,
        document.body
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {showDeleteConfirm && createPortal(
        <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)" }}>
          <div style={{ background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"16px", padding:"28px 28px 22px", maxWidth:"320px", width:"90%", boxShadow:"0 16px 48px rgba(0,0,0,0.6)" }}>
            <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:"#3D0A14", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"16px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="#F04060" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6" stroke="#F04060" strokeWidth="2" strokeLinecap="round"/><path d="M10 11v6M14 11v6" stroke="#F04060" strokeWidth="2" strokeLinecap="round"/><path d="M9 6V4h6v2" stroke="#F04060" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <div style={{ fontFamily:R, fontSize:"16px", color:"#1B3A2D", marginBottom:"8px", letterSpacing:"0.5px" }}>Delete post?</div>
            <div style={{ fontFamily:B, fontSize:"13px", color:"#5A7A60", lineHeight:1.6, marginBottom:"24px" }}>This action can't be undone. The post will be permanently removed.</div>
            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={() => setShowDeleteConfirm(false)}
                style={{ flex:1, padding:"10px", borderRadius:"10px", background:"none", border:"2px solid #DDE8DD", cursor:"pointer", fontFamily:R, fontSize:"13px", color:"#5A7A60", letterSpacing:"0.5px" }}
                onMouseEnter={e=>(e.currentTarget.style.borderColor="#3CCE2A")} onMouseLeave={e=>(e.currentTarget.style.borderColor="#DDE8DD")}>
                Cancel
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); handleDelete(); }}
                style={{ flex:1, padding:"10px", borderRadius:"10px", background:"#F04060", border:"none", cursor:"pointer", fontFamily:R, fontSize:"13px", color:"#fff", letterSpacing:"0.5px" }}
                onMouseEnter={e=>(e.currentTarget.style.background="#C0304A")} onMouseLeave={e=>(e.currentTarget.style.background="#F04060")}>
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {lightboxImg&&(
        <div onClick={()=>setLightboxImg(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.93)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, cursor:"zoom-out" }}>
          <img src={lightboxImg} alt="" style={{ maxWidth:"90vw", maxHeight:"90vh", objectFit:"contain", borderRadius:"8px" }}/>
          <button onClick={()=>setLightboxImg(null)} style={{ position:"absolute", top:"20px", right:"24px", background:"none", border:"none", color:"#1B3A2D", fontSize:"28px", cursor:"pointer" }}>✕</button>
        </div>
      )}
    </div>
  );
}