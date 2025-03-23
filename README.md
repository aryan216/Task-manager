#### Tech Stack used

# Hono js

- Used to create APIs, it is used due to its fast and ultra-lightweight nature and also the optimization for serverless environments such as vercel and cludeflare.
- It supports global middleware, and also id does not require to wrap the middleware on the route just like nextjs.
- Unlike Nextjs we can write our Api routes outside of API folder in hono.

# Tanstack Query

- Used tanstack query with Hono js for end to end tyepsafety such as if you are writing axios.post('/foo/${abc}'), then it will highlight whether the route 'foo' exists or not.

# Appwrite

- Used appwrite for creating user and storing other data.
- Used server-only package to keep the keys and other tokens safe, you just have to write "import server-only" on the top of the page and it will convert that page to server side page.

# server-only (npm package)

- It is used to convert the page to server side page, inspite of default server page behaviour of next js, it is used because if you write "import server-only" on top of a page then it will create it as a server page, and it will also give error if you import it in a client side page.

# useMedia (react-use package)

- This package is generally used to create responsive media screens such as for a mobile screen you want a dialog box and for a desktop screen you want a drawer and that can be achieved using this package

# nuqs (package)

- Instead of using tools like justand and redux for managing not-so-important global states such as opening and closing modals, we can use this package for that by adding the states in url only so that you can directly open a modal just by sending the url

# RPC & gRPC

- RPC in this project is used for better coupling and typesafe api (due to its inference of type)
- gRPC format is widely adopted due to two reasons, first one is the use of ProtoBuf (protocol buffers data type instead of json which is a strongly typed data type and is much faster than json), and second is the gRPC is built on top of HTTP/2 to provide a high-performance foundation at scale.

# Developer Tools - Performance Tab

##### Interaction to Next Paint (INP) - It measures the time it takes from the user initiating an interaction (like a click or tap) to the next significant screen update that results from that interaction.

##### Cumulative Layout Shift (CLS) - It measures the total amount of unexpected layout shifts that occur while a page is loading. Layout shifts happen when elements on the page move from one position to another

##### Largest Contentful Paint (LCP) - It measures the time it takes for the largest visible content element (such as an image, video, or block of text) to load and become visible within the viewport. Essentially, LCP gauges how long it takes for the main content of a page to load and appear to the user.

#### Optional execution of Functions

- getData?.()

### Date (issue) in Appwrite

Appwrite stores the date in UTC(Coordinated Universal Time) which is different from IST & GMT.
To calculate the correct IST we should add 5:30 to UTC as IST is equals to GMT +5:30
